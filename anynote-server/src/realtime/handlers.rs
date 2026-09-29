use std::{convert::Infallible, time::Duration};

use axum::{
    extract::State,
    response::sse::{Event, KeepAlive, Sse},
};
use futures_util::{Stream, StreamExt};
use tokio_stream::wrappers::{BroadcastStream, errors::BroadcastStreamRecvError};
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    error::AppError,
    http::extract::Path,
    state::AppState,
    workspaces::access::{Access, authorize},
};

pub async fn events(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;

    let stream = BroadcastStream::new(state.changes.subscribe())
        .filter_map(move |message| async move {
            match message {
                Ok(change) if change.workspace_id == workspace_id => Some(Ok(Event::default()
                    .event("change")
                    .data(change.cursor.to_string()))),
                Ok(_) => None,
                Err(BroadcastStreamRecvError::Lagged(_)) => {
                    Some(Ok(Event::default().event("change").data("")))
                }
            }
        })
        .take_until(state.shutdown.cancelled_owned());

    Ok(Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(20))))
}
