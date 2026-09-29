import { apiRequest } from "~/lib/api/client";

export type Change = {
  id: number;
  entity: "workspace" | "note" | "collection" | "attachment";
  entityId: string;
  operation: "upsert" | "delete";
};

export function getChangesCursor(token: string, workspaceId: string) {
  return apiRequest<{ cursor: number }>(`/workspaces/${workspaceId}/changes/cursor`, { token });
}

export function listChanges(token: string, workspaceId: string, after: number) {
  return apiRequest<{ changes: Change[]; cursor: number; hasMore: boolean }>(
    `/workspaces/${workspaceId}/changes?after=${after}`,
    { token },
  );
}
