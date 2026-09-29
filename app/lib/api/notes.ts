import { apiRequest } from "~/lib/api/client";

export type NoteRecord = {
  id: string;
  encryptedData: string;
  version: number;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function listNotes(token: string, workspaceId: string) {
  return apiRequest<NoteRecord[]>(`/workspaces/${workspaceId}/notes`, { token });
}

export function getNoteRecord(token: string, workspaceId: string, noteId: string) {
  return apiRequest<NoteRecord>(`/workspaces/${workspaceId}/notes/${noteId}`, { token });
}

export function createNoteRecord(
  token: string,
  workspaceId: string,
  body: { id: string; encryptedData: string },
) {
  return apiRequest<NoteRecord>(`/workspaces/${workspaceId}/notes`, {
    method: "POST",
    token,
    body,
  });
}

export function updateNoteRecord(
  token: string,
  workspaceId: string,
  noteId: string,
  body: { baseVersion: number; encryptedData?: string; trashed?: boolean },
) {
  return apiRequest<NoteRecord>(`/workspaces/${workspaceId}/notes/${noteId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function deleteNoteRecord(token: string, workspaceId: string, noteId: string) {
  return apiRequest<void>(`/workspaces/${workspaceId}/notes/${noteId}`, {
    method: "DELETE",
    token,
  });
}
