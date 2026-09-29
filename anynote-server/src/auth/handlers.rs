use axum::{extract::State, http::StatusCode};
use opaque_ke::{
    CredentialFinalization, CredentialRequest, RegistrationRequest, RegistrationUpload,
    ServerLogin, ServerLoginParameters, ServerRegistration,
};
use rand::rngs::OsRng;

use crate::{
    account::load_account,
    auth::{
        model::{
            LoginFinishRequest, LoginFinishResponse, LoginStartRequest, LoginStartResponse,
            PasswordFinishRequest, PasswordStartRequest, RegisterFinishRequest,
            RegisterFinishResponse, RegisterStartRequest, RegisterStartResponse,
        },
        opaque::Suite,
        session::{AuthUser, create_session},
        username::normalize_username,
    },
    crypto::envelope,
    error::AppError,
    http::extract::Json,
    state::AppState,
};

pub const LOGIN_ATTEMPT_TTL_SECONDS: f64 = 120.0;

pub async fn is_username_taken(state: &AppState, username: &str) -> Result<bool, AppError> {
    Ok(sqlx::query_scalar!(
        r#"select exists(select 1 from users where username = $1) as "taken!""#,
        username,
    )
    .fetch_one(&state.db)
    .await?)
}

pub async fn register_start(
    State(state): State<AppState>,
    Json(request): Json<RegisterStartRequest>,
) -> Result<Json<RegisterStartResponse>, AppError> {
    let username = normalize_username(&request.username)?;
    // fail before the client spends seconds on key stretching
    if is_username_taken(&state, &username).await? {
        return Err(AppError::Conflict("username is taken".into()));
    }

    let registration_request =
        RegistrationRequest::<Suite>::deserialize(&request.registration_request)
            .map_err(|_| AppError::bad_request("invalid registration request"))?;
    let result = ServerRegistration::<Suite>::start(
        &state.opaque,
        registration_request,
        username.as_bytes(),
    )
    .map_err(|_| AppError::bad_request("invalid registration request"))?;

    Ok(Json(RegisterStartResponse {
        registration_response: result.message.serialize().to_vec(),
    }))
}

pub async fn register_finish(
    State(state): State<AppState>,
    Json(request): Json<RegisterFinishRequest>,
) -> Result<(StatusCode, Json<RegisterFinishResponse>), AppError> {
    let username = normalize_username(&request.username)?;
    request.key_stretching.validate()?;
    if request.public_key.len() != 32 {
        return Err(AppError::bad_request("public key must be 32 bytes"));
    }

    let upload = RegistrationUpload::<Suite>::deserialize(&request.registration_record)
        .map_err(|_| AppError::bad_request("invalid registration record"))?;
    let password_file = ServerRegistration::<Suite>::finish(upload);
    let key_stretching = serde_json::to_value(&request.key_stretching)
        .map_err(|error| AppError::Internal(error.to_string()))?;

    let mut tx = state.db.begin().await?;

    let user_id = sqlx::query_scalar!(
        "insert into users (username, opaque_record, key_stretching, public_key, encrypted_private_key)
         values ($1, $2, $3, $4, $5)
         returning id",
        username,
        password_file.serialize().to_vec(),
        key_stretching,
        request.public_key,
        request.encrypted_private_key,
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|error| match &error {
        sqlx::Error::Database(db_error) if db_error.is_unique_violation() => {
            AppError::Conflict("username is taken".into())
        }
        _ => error.into(),
    })?;

    let workspace = request.workspace;
    sqlx::query!(
        "insert into workspaces (id, encrypted_name) values ($1, $2)",
        workspace.id,
        workspace.encrypted_name,
    )
    .execute(&mut *tx)
    .await?;
    sqlx::query!(
        "insert into workspace_members (workspace_id, user_id, role, encrypted_workspace_key)
         values ($1, $2, 'owner', $3)",
        workspace.id,
        user_id,
        workspace.encrypted_workspace_key,
    )
    .execute(&mut *tx)
    .await?;
    sqlx::query!(
        "insert into changes (workspace_id, entity, entity_id, operation)
         values ($1, 'workspace', $1, 'upsert')",
        workspace.id,
    )
    .execute(&mut *tx)
    .await?;

    let session = create_session(&mut tx, user_id).await?;
    tx.commit().await?;

    Ok((
        StatusCode::CREATED,
        Json(RegisterFinishResponse {
            user_id,
            workspace_id: workspace.id,
            session,
        }),
    ))
}

pub async fn login_start(
    State(state): State<AppState>,
    Json(request): Json<LoginStartRequest>,
) -> Result<Json<LoginStartResponse>, AppError> {
    let username = normalize_username(&request.username)?;
    state
        .login_limiter
        .check_key(&username)
        .map_err(|_| AppError::RateLimited)?;
    let credential_request = CredentialRequest::<Suite>::deserialize(&request.credential_request)
        .map_err(|_| AppError::bad_request("invalid credential request"))?;

    sqlx::query!("delete from login_attempts where expires_at < now()")
        .execute(&state.db)
        .await?;

    let user = sqlx::query!(
        "select id, opaque_record, key_stretching from users where username = $1",
        username,
    )
    .fetch_optional(&state.db)
    .await?;

    let password_file = user
        .as_ref()
        .map(|user| ServerRegistration::<Suite>::deserialize(&user.opaque_record))
        .transpose()
        .map_err(|error| AppError::Internal(error.to_string()))?;
    let key_stretching = user
        .as_ref()
        .and_then(|user| serde_json::from_value(user.key_stretching.clone()).ok())
        .unwrap_or_default();

    // with no password file opaque-ke returns a fake response, so unknown usernames look like real ones
    let result = ServerLogin::start(
        &mut OsRng,
        &state.opaque,
        password_file,
        credential_request,
        username.as_bytes(),
        ServerLoginParameters::default(),
    )
    .map_err(|_| AppError::bad_request("invalid credential request"))?;

    let login_id = sqlx::query_scalar!(
        "insert into login_attempts (user_id, opaque_server_state, expires_at)
         values ($1, $2, now() + make_interval(secs => $3))
         returning id",
        user.map(|user| user.id),
        result.state.serialize().to_vec(),
        LOGIN_ATTEMPT_TTL_SECONDS,
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(LoginStartResponse {
        login_id,
        credential_response: result.message.serialize().to_vec(),
        key_stretching,
    }))
}

pub async fn login_finish(
    State(state): State<AppState>,
    Json(request): Json<LoginFinishRequest>,
) -> Result<Json<LoginFinishResponse>, AppError> {
    let attempt = sqlx::query!(
        "delete from login_attempts where id = $1 and expires_at > now()
         returning user_id, opaque_server_state",
        request.login_id,
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    let server_login = ServerLogin::<Suite>::deserialize(&attempt.opaque_server_state)
        .map_err(|error| AppError::Internal(error.to_string()))?;
    let finalization =
        CredentialFinalization::<Suite>::deserialize(&request.credential_finalization)
            .map_err(|_| AppError::Unauthorized)?;
    server_login
        .finish(finalization, ServerLoginParameters::default())
        .map_err(|_| AppError::Unauthorized)?;
    let user_id = attempt.user_id.ok_or(AppError::Unauthorized)?;

    let mut tx = state.db.begin().await?;
    let session = create_session(&mut tx, user_id).await?;
    let account = load_account(&mut tx, user_id).await?;
    tx.commit().await?;

    Ok(Json(LoginFinishResponse { session, account }))
}

pub async fn logout(State(state): State<AppState>, auth: AuthUser) -> Result<StatusCode, AppError> {
    sqlx::query!("delete from sessions where id = $1", auth.session_id)
        .execute(&state.db)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn password_start(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(request): Json<PasswordStartRequest>,
) -> Result<Json<RegisterStartResponse>, AppError> {
    auth.require_recent_login()?;
    let username = sqlx::query_scalar!("select username from users where id = $1", auth.user_id)
        .fetch_one(&state.db)
        .await?;

    let registration_request =
        RegistrationRequest::<Suite>::deserialize(&request.registration_request)
            .map_err(|_| AppError::bad_request("invalid registration request"))?;
    let result = ServerRegistration::<Suite>::start(
        &state.opaque,
        registration_request,
        username.as_bytes(),
    )
    .map_err(|_| AppError::bad_request("invalid registration request"))?;

    Ok(Json(RegisterStartResponse {
        registration_response: result.message.serialize().to_vec(),
    }))
}

pub async fn password_finish(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(request): Json<PasswordFinishRequest>,
) -> Result<StatusCode, AppError> {
    auth.require_recent_login()?;
    request.key_stretching.validate()?;
    envelope::validate("encryptedPrivateKey", &request.encrypted_private_key)?;

    let upload = RegistrationUpload::<Suite>::deserialize(&request.registration_record)
        .map_err(|_| AppError::bad_request("invalid registration record"))?;
    let password_file = ServerRegistration::<Suite>::finish(upload);
    let key_stretching = serde_json::to_value(&request.key_stretching)
        .map_err(|error| AppError::Internal(error.to_string()))?;

    let mut tx = state.db.begin().await?;
    sqlx::query!(
        "update users set opaque_record = $2, key_stretching = $3, encrypted_private_key = $4
         where id = $1",
        auth.user_id,
        password_file.serialize().to_vec(),
        key_stretching,
        request.encrypted_private_key,
    )
    .execute(&mut *tx)
    .await?;
    // everyone else signed in with the old password gets signed out
    sqlx::query!(
        "delete from sessions where user_id = $1 and id <> $2",
        auth.user_id,
        auth.session_id,
    )
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}
