use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SweepRequest {
    pub keep: Vec<Uuid>,
}

#[derive(Serialize)]
pub struct SweepResponse {
    pub removed: usize,
}
