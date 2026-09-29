import { apiRequest } from "~/lib/api/client";

export type CollectionRecord = {
  id: string;
  parentId: string | null;
  encryptedName: string;
  position: number;
  noteIds: string[];
  createdAt: string;
  updatedAt: string;
};

export function listCollections(token: string, workspaceId: string) {
  return apiRequest<CollectionRecord[]>(`/workspaces/${workspaceId}/collections`, { token });
}

export function createCollectionRecord(
  token: string,
  workspaceId: string,
  body: { id: string; parentId: string | null; encryptedName: string; position: number },
) {
  return apiRequest<void>(`/workspaces/${workspaceId}/collections`, {
    method: "POST",
    token,
    body,
  });
}

export function updateCollectionRecord(
  token: string,
  workspaceId: string,
  collectionId: string,
  body: { encryptedName?: string; parentId?: string | null },
) {
  return apiRequest<void>(`/workspaces/${workspaceId}/collections/${collectionId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function deleteCollectionRecord(token: string, workspaceId: string, collectionId: string) {
  return apiRequest<void>(`/workspaces/${workspaceId}/collections/${collectionId}`, {
    method: "DELETE",
    token,
  });
}

export function addNoteToCollectionRecord(
  token: string,
  workspaceId: string,
  collectionId: string,
  noteId: string,
) {
  return apiRequest<void>(
    `/workspaces/${workspaceId}/collections/${collectionId}/notes/${noteId}`,
    { method: "PUT", token },
  );
}

export function removeNoteFromCollectionRecord(
  token: string,
  workspaceId: string,
  collectionId: string,
  noteId: string,
) {
  return apiRequest<void>(
    `/workspaces/${workspaceId}/collections/${collectionId}/notes/${noteId}`,
    { method: "DELETE", token },
  );
}

export function reorderCollectionRecords(token: string, workspaceId: string, ids: string[]) {
  return apiRequest<void>(`/workspaces/${workspaceId}/collections/order`, {
    method: "PUT",
    token,
    body: { ids },
  });
}

export function reorderCollectionNoteRecords(
  token: string,
  workspaceId: string,
  collectionId: string,
  noteIds: string[],
) {
  return apiRequest<void>(`/workspaces/${workspaceId}/collections/${collectionId}/notes`, {
    method: "PUT",
    token,
    body: { ids: noteIds },
  });
}
