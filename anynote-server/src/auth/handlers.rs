use axum::{extract::State, http::StatusCode};
use opaque_ke::{
    CredentialFinalization, CredentialRequest, RegistrationRequest, RegistrationUpload,
    ServerLogin, ServerLoginParameters, ServerRegistration,
};
use rand::rngs::OsRng;

use crate::{
    account::repo::load_account,
    auth::{
        model::{
            LoginFinishRequest, LoginFinishResponse, LoginStartRequest, LoginStartResponse,
            PasswordFinishRequest, PasswordStartRequest, RegisterFinishRequest,
            RegisterFinishResponse, RegisterStartRequest, RegisterStartResponse,
        },
        opaque::Suite,
        repo,
        session::{AuthUser, create_session},
        username::normalize_username,
    },
    changes::{self, Entity, Operation},
    crypto::envelope,
    error::AppError,
    http::extract::Json,
    sessions::repo as sessions,
    state::AppState,
    workspaces::repo as workspaces,
};

pub const LOGIN_ATTEMPT_TTL_SECONDS: f64 = 120.0;

pub async fn register_start(
    State(state): State<AppState>,
    Json(request): Json<RegisterStartRequest>,
) -> Result<Json<RegisterStartResponse>, AppError> {
    let username = normalize_username(&request.username)?;
    // fail before the client spends seconds on key stretching
    if repo::is_username_taken(&state.db, &username).await? {
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

    let user_id = repo::insert_user(
        &mut *tx,
        &username,
        &password_file.serialize(),
        &key_stretching,
        &request.public_key,
        &request.encrypted_private_key,
    )
    .await
    .map_err(AppError::conflict_on_unique("username is taken"))?;

    let workspace = request.workspace;
    workspaces::insert_with_owner(
        &mut tx,
        workspace.id,
        &workspace.encrypted_name,
        user_id,
        &workspace.encrypted_workspace_key,
    )
    .await?;
    changes::record(
        &mut tx,
        workspace.id,
        Entity::Workspace,
        workspace.id,
        Operation::Upsert,
    )
    .await?;

    let session = create_session(&mut *tx, user_id).await?;
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

    repo::delete_expired_login_attempts(&state.db).await?;
    let user = repo::find_login_user(&state.db, &username).await?;

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

    let login_id = repo::insert_login_attempt(
        &state.db,
        user.map(|user| user.id),
        &result.state.serialize(),
        LOGIN_ATTEMPT_TTL_SECONDS,
    )
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
    let attempt = repo::take_login_attempt(&state.db, request.login_id)
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
    let session = create_session(&mut *tx, user_id).await?;
    let account = load_account(&mut tx, user_id).await?;
    tx.commit().await?;

    Ok(Json(LoginFinishResponse { session, account }))
}

pub async fn logout(State(state): State<AppState>, auth: AuthUser) -> Result<StatusCode, AppError> {
    sessions::delete(&state.db, auth.session_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn password_start(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(request): Json<PasswordStartRequest>,
) -> Result<Json<RegisterStartResponse>, AppError> {
    auth.require_recent_login()?;
    let username = repo::username(&state.db, auth.user_id).await?;

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
    repo::update_credentials(
        &mut *tx,
        auth.user_id,
        &password_file.serialize(),
        &key_stretching,
        &request.encrypted_private_key,
    )
    .await?;
    // everyone else signed in with the old password gets signed out
    sessions::delete_others(&mut *tx, auth.user_id, auth.session_id).await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}
