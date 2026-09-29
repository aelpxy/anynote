use axum::{extract::State, http::StatusCode};
use sqlx::PgConnection;
use uuid::Uuid;

use crate::{
    account::model::{Account, AccountUser, AccountWorkspace},
    auth::session::AuthUser,
    error::AppError,
    http::extract::Json,
    state::AppState,
};

pub async fn load_account(db: &mut PgConnection, user_id: Uuid) -> Result<Account, AppError> {
    let user = sqlx::query_as!(
        AccountUser,
        "select id, username, public_key, encrypted_private_key from users where id = $1",
        user_id,
    )
    .fetch_optional(&mut *db)
    .await?
    .ok_or(AppError::NotFound)?;

    let workspaces = sqlx::query_as!(
        AccountWorkspace,
        "select w.id, m.role, w.encrypted_name, m.encrypted_workspace_key
         from workspace_members m
         join workspaces w on w.id = m.workspace_id
         where m.user_id = $1
         order by w.created_at",
        user_id,
    )
    .fetch_all(&mut *db)
    .await?;

    Ok(Account { user, workspaces })
}

pub async fn me(State(state): State<AppState>, auth: AuthUser) -> Result<Json<Account>, AppError> {
    let mut db = state.db.acquire().await?;
    Ok(Json(load_account(&mut db, auth.user_id).await?))
}

pub async fn delete_account(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<StatusCode, AppError> {
    auth.require_recent_login()?;

    let mut tx = state.db.begin().await?;
    let owned_workspaces = sqlx::query_scalar!(
        "delete from workspaces where id in (
           select workspace_id from workspace_members where user_id = $1 and role = 'owner'
         )
         returning id",
        auth.user_id,
    )
    .fetch_all(&mut *tx)
    .await?;
    sqlx::query!("delete from users where id = $1", auth.user_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    for workspace_id in owned_workspaces {
        state.storage.delete_workspace(workspace_id).await?;
    }
    Ok(StatusCode::NO_CONTENT)
}
