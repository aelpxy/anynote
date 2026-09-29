use axum::{
    body::Body,
    extract::State,
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};
use tokio_util::io::ReaderStream;
use uuid::Uuid;

use crate::{
    attachments::model::{SweepRequest, SweepResponse},
    auth::session::AuthUser,
    changes::{self, Entity, Operation},
    error::AppError,
    http::extract::{Json, Path},
    state::AppState,
    workspaces::access::{Access, authorize},
};

pub async fn upload(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, attachment_id)): Path<(Uuid, Uuid)>,
    body: Body,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;

    let exists = sqlx::query_scalar!(
        r#"select exists(select 1 from attachments where id = $1) as "exists!""#,
        attachment_id,
    )
    .fetch_one(&state.db)
    .await?;
    if exists {
        return Err(AppError::Conflict("attachment already exists".into()));
    }

    let size = state
        .storage
        .write(
            workspace_id,
            attachment_id,
            body.into_data_stream(),
            state.max_attachment_size,
        )
        .await?;

    let saved = async {
        let mut tx = state.db.begin().await?;
        sqlx::query!(
            "insert into attachments (id, workspace_id, size) values ($1, $2, $3)",
            attachment_id,
            workspace_id,
            size as i64,
        )
        .execute(&mut *tx)
        .await?;
        changes::record(
            &mut tx,
            workspace_id,
            Entity::Attachment,
            attachment_id,
            Operation::Upsert,
        )
        .await?;
        tx.commit().await?;
        Ok::<_, AppError>(())
    }
    .await;

    if let Err(error) = saved {
        state.storage.delete(workspace_id, attachment_id).await.ok();
        return Err(error);
    }

    Ok(StatusCode::CREATED)
}

pub async fn download(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, attachment_id)): Path<(Uuid, Uuid)>,
) -> Result<Response, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;

    let size = sqlx::query_scalar!(
        "select size from attachments where workspace_id = $1 and id = $2",
        workspace_id,
        attachment_id,
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;
    let file = state.storage.open(workspace_id, attachment_id).await?;

    Ok((
        [
            (header::CONTENT_TYPE, "application/octet-stream".to_string()),
            (header::CONTENT_LENGTH, size.to_string()),
            (header::CONTENT_DISPOSITION, "attachment".to_string()),
            (
                header::CACHE_CONTROL,
                "private, max-age=31536000, immutable".to_string(),
            ),
            (header::X_CONTENT_TYPE_OPTIONS, "nosniff".to_string()),
        ],
        Body::from_stream(ReaderStream::new(file)),
    )
        .into_response())
}

pub async fn delete(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, attachment_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;

    let mut tx = state.db.begin().await?;
    let deleted = sqlx::query!(
        "delete from attachments where workspace_id = $1 and id = $2",
        workspace_id,
        attachment_id,
    )
    .execute(&mut *tx)
    .await?;
    if deleted.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    changes::record(
        &mut tx,
        workspace_id,
        Entity::Attachment,
        attachment_id,
        Operation::Delete,
    )
    .await?;
    tx.commit().await?;
    state.storage.delete(workspace_id, attachment_id).await?;

    Ok(StatusCode::NO_CONTENT)
}

// the server can't read notes, so clients report which attachments are still referenced
pub async fn sweep(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
    Json(request): Json<SweepRequest>,
) -> Result<Json<SweepResponse>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;

    let mut tx = state.db.begin().await?;
    // a grace period keeps uploads that aren't saved into a note yet
    let removed = sqlx::query_scalar!(
        "delete from attachments
         where workspace_id = $1 and id <> all($2) and created_at < now() - interval '1 day'
         returning id",
        workspace_id,
        &request.keep,
    )
    .fetch_all(&mut *tx)
    .await?;
    for &attachment_id in &removed {
        changes::record(
            &mut tx,
            workspace_id,
            Entity::Attachment,
            attachment_id,
            Operation::Delete,
        )
        .await?;
    }
    tx.commit().await?;

    for &attachment_id in &removed {
        state.storage.delete(workspace_id, attachment_id).await?;
    }
    Ok(Json(SweepResponse {
        removed: removed.len(),
    }))
}
