import { apiRequest } from "~/lib/api/client";

export type LinkPreviewRecord = {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
};

export function fetchLinkPreviewRecord(token: string, url: string) {
  return apiRequest<LinkPreviewRecord>("/link-preview", { method: "POST", token, body: { url } });
}
