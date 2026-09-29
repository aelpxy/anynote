use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct PreviewRequest {
    pub url: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LinkPreview {
    pub url: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub site_name: Option<String>,
}
