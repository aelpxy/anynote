use std::{
    collections::HashMap,
    io::Write,
    sync::{LazyLock, OnceLock},
};

use axum::{
    body::{Body, Bytes},
    http::{HeaderMap, HeaderValue, header},
    response::{IntoResponse, Response},
};
use flate2::{Compression, write::GzEncoder};
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "../build/client/"]
#[allow_missing = true]
struct Assets;

const COMPRESSIBLE_EXTENSIONS: &[&str] = &[
    "js",
    "mjs",
    "css",
    "html",
    "svg",
    "json",
    "webmanifest",
    "txt",
    "map",
];
const MIN_COMPRESSIBLE_SIZE: usize = 1024;
const BROTLI_QUALITY: i32 = 9;

struct Encoded {
    brotli: Bytes,
    gzip: Bytes,
}

static COMPRESSED: LazyLock<HashMap<String, OnceLock<Encoded>>> = LazyLock::new(|| {
    Assets::iter()
        .filter(|path| is_compressible(path))
        .map(|path| (path.into_owned(), OnceLock::new()))
        .collect()
});

fn is_compressible(path: &str) -> bool {
    let extension = path.rsplit_once('.').map_or("", |(_, extension)| extension);
    COMPRESSIBLE_EXTENSIONS.contains(&extension)
        && Assets::get(path).is_some_and(|file| file.data.len() >= MIN_COMPRESSIBLE_SIZE)
}

fn encode(data: &[u8]) -> Encoded {
    let mut brotli = Vec::new();
    let params = brotli::enc::BrotliEncoderParams {
        quality: BROTLI_QUALITY,
        ..Default::default()
    };
    brotli::BrotliCompress(&mut &data[..], &mut brotli, &params)
        .expect("compressing into memory can't fail");

    let mut gzip = GzEncoder::new(Vec::new(), Compression::best());
    gzip.write_all(data)
        .expect("compressing into memory can't fail");
    let gzip = gzip.finish().expect("compressing into memory can't fail");

    Encoded {
        brotli: Bytes::from(brotli),
        gzip: Bytes::from(gzip),
    }
}

fn compressed(path: &str) -> Option<&'static Encoded> {
    let slot = COMPRESSED.get(path)?;
    Some(slot.get_or_init(|| encode(&Assets::get(path).expect("listed assets exist").data)))
}

pub fn warm_compression_cache() {
    for path in COMPRESSED.keys() {
        compressed(path);
    }
}

fn accepts(accept_encoding: &str, encoding: &str) -> bool {
    accept_encoding.split(',').any(|entry| {
        let mut parts = entry.split(';').map(str::trim);
        parts.next() == Some(encoding)
            && parts.all(|param| {
                param
                    .strip_prefix("q=")
                    .and_then(|q| q.parse::<f32>().ok())
                    .is_none_or(|q| q > 0.0)
            })
    })
}

pub fn file_response(
    path: &str,
    cache_control: &'static str,
    request: &HeaderMap,
) -> Option<Response> {
    let file = Assets::get(path)?;
    let accept_encoding = request
        .get(header::ACCEPT_ENCODING)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("");

    let (body, encoding) = match compressed(path) {
        Some(encoded) if accepts(accept_encoding, "br") => (encoded.brotli.clone(), Some("br")),
        Some(encoded) if accepts(accept_encoding, "gzip") => (encoded.gzip.clone(), Some("gzip")),
        _ => (Bytes::from(file.data.into_owned()), None),
    };

    let mut response = (
        [
            (header::CONTENT_TYPE, file.metadata.mimetype().to_string()),
            (header::CACHE_CONTROL, cache_control.to_string()),
        ],
        Body::from(body),
    )
        .into_response();
    let headers = response.headers_mut();
    if COMPRESSED.contains_key(path) {
        headers.insert(header::VARY, HeaderValue::from_static("accept-encoding"));
    }
    if let Some(encoding) = encoding {
        headers.insert(header::CONTENT_ENCODING, HeaderValue::from_static(encoding));
    }
    Some(response)
}

pub fn index_html() -> String {
    Assets::get("index.html")
        .map(|file| String::from_utf8_lossy(&file.data).into_owned())
        .unwrap_or_default()
}
