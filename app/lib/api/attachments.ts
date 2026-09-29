import { apiFetch, apiRequest } from "~/lib/api/client";

export async function uploadAttachment(
  token: string,
  workspaceId: string,
  attachmentId: string,
  encrypted: Uint8Array<ArrayBuffer>,
) {
  await apiFetch(`/workspaces/${workspaceId}/attachments/${attachmentId}`, {
    method: "PUT",
    token,
    headers: { "content-type": "application/octet-stream" },
    body: new Blob([encrypted]),
  });
}

export async function downloadAttachment(token: string, workspaceId: string, attachmentId: string) {
  const response = await apiFetch(`/workspaces/${workspaceId}/attachments/${attachmentId}`, {
    token,
  });
  return new Uint8Array(await response.arrayBuffer());
}

export function sweepAttachments(token: string, workspaceId: string, keep: string[]) {
  return apiRequest<{ removed: number }>(`/workspaces/${workspaceId}/attachments/sweep`, {
    method: "POST",
    token,
    body: { keep },
  });
}
