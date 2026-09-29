use std::sync::LazyLock;

use axum::http::HeaderValue;
use base64::{Engine, engine::general_purpose::STANDARD};
use sha2::{Digest, Sha256};

use crate::web::assets::index_html;

// the build inlines a few scripts into index.html, so only those exact scripts are allowed to run
fn inline_script_hashes(html: &str) -> Vec<String> {
    let mut hashes = Vec::new();
    let mut rest = html;
    while let Some(start) = rest.find("<script") {
        rest = &rest[start..];
        let Some(tag_end) = rest.find('>') else { break };
        let Some(close) = rest.find("</script>") else {
            break;
        };
        if !rest[..tag_end].contains(" src=") {
            let body = &rest[tag_end + 1..close];
            hashes.push(format!(
                "'sha256-{}'",
                STANDARD.encode(Sha256::digest(body))
            ));
        }
        rest = &rest[close + "</script>".len()..];
    }
    hashes
}

pub static CONTENT_SECURITY_POLICY: LazyLock<HeaderValue> = LazyLock::new(|| {
    let policy = [
        "default-src 'self'".to_string(),
        // the crypto libraries run as webassembly, which needs wasm-unsafe-eval but not eval
        format!(
            "script-src 'self' 'wasm-unsafe-eval' {}",
            inline_script_hashes(&index_html()).join(" ")
        ),
        // editor, toolbars and animations set inline styles at runtime
        "style-src 'self' 'unsafe-inline'".to_string(),
        // decrypted images are shown from blob urls
        "img-src 'self' blob: data:".to_string(),
        "media-src 'self' blob:".to_string(),
        "font-src 'self'".to_string(),
        "connect-src 'self'".to_string(),
        "worker-src 'self' blob:".to_string(),
        "manifest-src 'self'".to_string(),
        "object-src 'none'".to_string(),
        "base-uri 'none'".to_string(),
        "form-action 'self'".to_string(),
        "frame-ancestors 'none'".to_string(),
    ]
    .join("; ");
    HeaderValue::from_str(&policy).expect("content security policy is a valid header value")
});
