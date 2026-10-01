use std::{sync::Arc, time::Duration};

use base64::{Engine, engine::general_purpose::STANDARD};

use reqwest::{Client, header, redirect::Policy};
use scraper::{Html, Selector};
use url::Url;

use crate::link_preview::{
    guard::{PublicResolver, is_allowed_url},
    model::LinkPreview,
};

const MAX_BODY_BYTES: usize = 512 * 1024;
const MAX_REDIRECTS: usize = 5;
const MAX_ICON_BYTES: usize = 32 * 1024;
const ICON_TIMEOUT: Duration = Duration::from_secs(2);
const ICON_TYPES: &[&str] = &[
    "image/png",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/svg+xml",
    "image/gif",
    "image/jpeg",
    "image/webp",
];

pub fn client() -> Client {
    Client::builder()
        .dns_resolver(Arc::new(PublicResolver))
        .redirect(Policy::custom(|attempt| {
            if attempt.previous().len() >= MAX_REDIRECTS {
                attempt.error("too many redirects")
            } else if !is_allowed_url(attempt.url()) {
                attempt.error("redirect to a disallowed address")
            } else {
                attempt.follow()
            }
        }))
        .timeout(Duration::from_secs(5))
        .connect_timeout(Duration::from_secs(3))
        .user_agent("AnynoteLinkPreview/1.0")
        .build()
        .expect("link preview client config is valid")
}

fn first_content(document: &Html, selectors: &[&str]) -> Option<String> {
    selectors.iter().find_map(|selector| {
        let selector = Selector::parse(selector).ok()?;
        let element = document.select(&selector).next()?;
        let text = match element.value().attr("content") {
            Some(content) => content.to_string(),
            None => element.text().collect(),
        };
        let text = text.split_whitespace().collect::<Vec<_>>().join(" ");
        (!text.is_empty()).then(|| text.chars().take(300).collect())
    })
}

fn declared_size(element: &scraper::ElementRef) -> u32 {
    element
        .value()
        .attr("sizes")
        .and_then(|sizes| sizes.split_whitespace().next())
        .and_then(|size| size.split(['x', 'X']).next())
        .and_then(|size| size.parse().ok())
        .unwrap_or(0)
}

// prefers the smallest declared icon that's still sharp at 2x, otherwise the first one listed
fn icon_href(document: &Html, base: &Url) -> Option<Url> {
    let selector = Selector::parse("link[rel~='icon'], link[rel='apple-touch-icon']").ok()?;
    let icons: Vec<_> = document
        .select(&selector)
        .filter(|element| element.value().attr("href").is_some())
        .collect();
    let chosen = icons
        .iter()
        .filter(|element| declared_size(element) >= 32)
        .min_by_key(|element| declared_size(element))
        .or_else(|| icons.first())?;
    base.join(chosen.value().attr("href")?).ok()
}

fn parse(url: &Url, html: &str) -> (LinkPreview, Option<Url>) {
    let document = Html::parse_document(html);
    let preview = LinkPreview {
        url: url.to_string(),
        title: first_content(
            &document,
            &[
                "meta[property='og:title']",
                "meta[name='twitter:title']",
                "title",
            ],
        ),
        description: first_content(
            &document,
            &[
                "meta[property='og:description']",
                "meta[name='twitter:description']",
                "meta[name='description']",
            ],
        ),
        site_name: first_content(&document, &["meta[property='og:site_name']"]),
        icon: None,
    };
    (preview, icon_href(&document, url))
}

// icons are inlined so the browser never contacts the linked site
async fn fetch_icon(client: &Client, url: Url) -> Option<String> {
    if !is_allowed_url(&url) {
        return None;
    }
    let mut response = client
        .get(url)
        .header(header::ACCEPT, "image/*")
        .timeout(ICON_TIMEOUT)
        .send()
        .await
        .ok()?
        .error_for_status()
        .ok()?;

    let content_type = response
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(';').next())
        .map(|value| value.trim().to_ascii_lowercase())
        .filter(|value| ICON_TYPES.contains(&value.as_str()))?;

    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await.ok()? {
        body.extend_from_slice(&chunk);
        if body.len() > MAX_ICON_BYTES {
            return None;
        }
    }
    (!body.is_empty()).then(|| format!("data:{content_type};base64,{}", STANDARD.encode(body)))
}

async fn with_icon(
    client: &Client,
    mut preview: LinkPreview,
    href: Option<Url>,
    base: &Url,
) -> LinkPreview {
    let fallback = base.join("/favicon.ico").ok();
    for candidate in [href, fallback].into_iter().flatten() {
        if let Some(icon) = fetch_icon(client, candidate).await {
            preview.icon = Some(icon);
            break;
        }
    }
    preview
}

pub async fn fetch_preview(client: &Client, url: &Url) -> Result<LinkPreview, reqwest::Error> {
    let mut response = client
        .get(url.clone())
        .header(header::ACCEPT, "text/html,application/xhtml+xml")
        .send()
        .await?
        .error_for_status()?;

    let final_url = response.url().clone();
    let is_html = response
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.contains("html"));
    if !is_html {
        let preview = LinkPreview {
            url: final_url.to_string(),
            title: None,
            description: None,
            site_name: None,
            icon: None,
        };
        return Ok(with_icon(client, preview, None, &final_url).await);
    }

    // metadata lives in the head, so there's no need to download whole pages
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await? {
        body.extend_from_slice(&chunk);
        if body.len() >= MAX_BODY_BYTES {
            break;
        }
    }

    let (preview, icon) = parse(&final_url, &String::from_utf8_lossy(&body));
    Ok(with_icon(client, preview, icon, &final_url).await)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefers_open_graph_then_falls_back() {
        let base = Url::parse("https://example.com/blog/post").unwrap();
        let (preview, icon) = parse(
            &base,
            r#"<html><head><title> Plain  title </title>
               <meta name="description" content="Meta description">
               <meta property="og:site_name" content="Example"></head></html>"#,
        );
        assert_eq!(preview.title.as_deref(), Some("Plain title"));
        assert_eq!(preview.description.as_deref(), Some("Meta description"));
        assert_eq!(preview.site_name.as_deref(), Some("Example"));
        assert!(icon.is_none());

        let (preview, _) = parse(
            &base,
            r#"<title>Fallback</title><meta property="og:title" content="Open Graph title">"#,
        );
        assert_eq!(preview.title.as_deref(), Some("Open Graph title"));
    }

    #[test]
    fn picks_a_sharp_icon_and_resolves_it() {
        let base = Url::parse("https://example.com/blog/post").unwrap();
        let (_, icon) = parse(
            &base,
            r#"<link rel="shortcut icon" href="/favicon.ico">
               <link rel="icon" sizes="16x16" href="/16.png">
               <link rel="icon" sizes="192x192" href="/192.png">
               <link rel="icon" sizes="32x32" href="icons/32.png">"#,
        );
        assert_eq!(
            icon.unwrap().as_str(),
            "https://example.com/blog/icons/32.png"
        );

        let (_, icon) = parse(&base, r#"<link rel="icon" href="//cdn.example.com/i.svg">"#);
        assert_eq!(icon.unwrap().as_str(), "https://cdn.example.com/i.svg");
    }
}
