import { apiRequest } from "~/lib/api/client";

export function createWorkspaceRecord(
  token: string,
  body: { id: string; encryptedName: string; encryptedWorkspaceKey: string },
) {
  return apiRequest<void>("/workspaces", { method: "POST", token, body });
}

export function renameWorkspaceRecord(token: string, workspaceId: string, encryptedName: string) {
  return apiRequest<void>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    token,
    body: { encryptedName },
  });
}

export function deleteWorkspaceRecord(token: string, workspaceId: string) {
  return apiRequest<void>(`/workspaces/${workspaceId}`, { method: "DELETE", token });
}
