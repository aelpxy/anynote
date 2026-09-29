use std::{sync::Arc, time::Duration};

use reqwest::{Client, header, redirect::Policy};
use scraper::{Html, Selector};
use url::Url;

use crate::link_preview::{
    guard::{PublicResolver, is_allowed_url},
    model::LinkPreview,
};

const MAX_BODY_BYTES: usize = 512 * 1024;
const MAX_REDIRECTS: usize = 5;

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

fn parse(url: String, html: &str) -> LinkPreview {
    let document = Html::parse_document(html);
    LinkPreview {
        url,
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
    }
}

pub async fn fetch_preview(client: &Client, url: &Url) -> Result<LinkPreview, reqwest::Error> {
    let mut response = client
        .get(url.clone())
        .header(header::ACCEPT, "text/html,application/xhtml+xml")
        .send()
        .await?
        .error_for_status()?;

    let final_url = response.url().to_string();
    let is_html = response
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.contains("html"));
    if !is_html {
        return Ok(LinkPreview {
            url: final_url,
            title: None,
            description: None,
            site_name: None,
        });
    }

    // metadata lives in the head, so there's no need to download whole pages
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await? {
        body.extend_from_slice(&chunk);
        if body.len() >= MAX_BODY_BYTES {
            break;
        }
    }

    Ok(parse(final_url, &String::from_utf8_lossy(&body)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefers_open_graph_then_falls_back() {
        let preview = parse(
            "https://example.com".into(),
            r#"<html><head><title> Plain  title </title>
               <meta name="description" content="Meta description">
               <meta property="og:site_name" content="Example"></head></html>"#,
        );
        assert_eq!(preview.title.as_deref(), Some("Plain title"));
        assert_eq!(preview.description.as_deref(), Some("Meta description"));
        assert_eq!(preview.site_name.as_deref(), Some("Example"));

        let preview = parse(
            "https://example.com".into(),
            r#"<title>Fallback</title><meta property="og:title" content="Open Graph title">"#,
        );
        assert_eq!(preview.title.as_deref(), Some("Open Graph title"));
    }
}
