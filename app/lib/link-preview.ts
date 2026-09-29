import { getAccount } from "~/lib/account/session-store";
import { fetchLinkPreviewRecord } from "~/lib/api/link-preview";

export type LinkPreview = {
  title: string;
  description: string;
  siteName: string;
  domain: string;
  isNote: boolean;
};

const notePathPattern = /^\/notes\/([^/?#]+)/;

export function getNoteIdFromHref(href: string) {
  return notePathPattern.exec(href)?.[1];
}

function fallbackPreview(url: URL): LinkPreview {
  const domain = url.hostname.replace(/^www\./, "");
  const path = url.pathname === "/" ? "" : decodeURIComponent(url.pathname);
  return { title: `${domain}${path}`, description: "", siteName: domain, domain, isNote: false };
}

export async function fetchLinkPreview(href: string): Promise<LinkPreview> {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { title: href, description: "", siteName: "Link", domain: "", isNote: false };
  }

  if (url.protocol === "mailto:") {
    return { title: url.pathname, description: "", siteName: "Email", domain: "", isNote: false };
  }

  const account = getAccount();
  if (!account) return fallbackPreview(url);

  try {
    const preview = await fetchLinkPreviewRecord(account.session.token, url.href);
    const fallback = fallbackPreview(new URL(preview.url));
    return {
      ...fallback,
      title: preview.title ?? fallback.title,
      description: preview.description ?? "",
      siteName: preview.siteName ?? fallback.siteName,
    };
  } catch {
    return fallbackPreview(url);
  }
}
