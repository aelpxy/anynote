use axum::{extract::State, http::StatusCode};
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    changes,
    crypto::envelope,
    error::AppError,
    http::extract::{Json, Path},
    state::AppState,
    workspaces::{
        access::{Access, authorize},
        model::{CreateWorkspace, RenameWorkspace},
    },
};

pub async fn create(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(request): Json<CreateWorkspace>,
) -> Result<StatusCode, AppError> {
    envelope::validate("encryptedName", &request.encrypted_name)?;

    let mut tx = state.db.begin().await?;
    sqlx::query!(
        "insert into workspaces (id, encrypted_name) values ($1, $2)",
        request.id,
        request.encrypted_name,
    )
    .execute(&mut *tx)
    .await
    .map_err(|error| match &error {
        sqlx::Error::Database(db_error) if db_error.is_unique_violation() => {
            AppError::Conflict("workspace already exists".into())
        }
        _ => error.into(),
    })?;
    sqlx::query!(
        "insert into workspace_members (workspace_id, user_id, role, encrypted_workspace_key)
         values ($1, $2, 'owner', $3)",
        request.id,
        auth.user_id,
        request.encrypted_workspace_key,
    )
    .execute(&mut *tx)
    .await?;
    changes::record(
        &mut tx,
        request.id,
        changes::Entity::Workspace,
        request.id,
        changes::Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::CREATED)
}

pub async fn rename(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
    Json(request): Json<RenameWorkspace>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;
    envelope::validate("encryptedName", &request.encrypted_name)?;

    let mut tx = state.db.begin().await?;
    sqlx::query!(
        "update workspaces set encrypted_name = $2 where id = $1",
        workspace_id,
        request.encrypted_name,
    )
    .execute(&mut *tx)
    .await?;
    changes::record(
        &mut tx,
        workspace_id,
        changes::Entity::Workspace,
        workspace_id,
        changes::Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Own).await?;

    let workspace_count = sqlx::query_scalar!(
        r#"select count(*) as "count!" from workspace_members where user_id = $1"#,
        auth.user_id,
    )
    .fetch_one(&state.db)
    .await?;
    if workspace_count <= 1 {
        return Err(AppError::bad_request(
            "you can't delete your only workspace",
        ));
    }

    sqlx::query!("delete from workspaces where id = $1", workspace_id)
        .execute(&state.db)
        .await?;
    state.storage.delete_workspace(workspace_id).await?;

    Ok(StatusCode::NO_CONTENT)
}
