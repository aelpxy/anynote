import { ApiError } from "~/lib/api/client";
import {
  createNoteRecord,
  deleteNoteRecord,
  emptyTrashRecords,
  getNoteRecord,
  type NoteRecord,
  updateNoteRecord,
} from "~/lib/api/notes";
import { encryptNote } from "~/lib/vault/codec";
import { isStatus, withRetry } from "~/lib/vault/connection";
import { getActiveNotes, getSortKey } from "~/lib/vault/queries";
import { enqueue, enqueueLatest } from "~/lib/vault/queue";
import type { NoteContent, Placement, Vault, VaultNote } from "~/lib/vault/types";

function applyRecord(vault: Vault, note: VaultNote, record: NoteRecord) {
  const updated = {
    ...note,
    version: record.version,
    trashedAt: record.trashedAt,
    updatedAt: record.updatedAt,
  };
  vault.notes.set(note.id, updated);
  return updated;
}

function requireNote(vault: Vault, noteId: string) {
  const note = vault.notes.get(noteId);
  if (!note) throw new Response("Note not found", { status: 404 });
  return note;
}

async function patchNote(
  vault: Vault,
  noteId: string,
  changes: { content?: NoteContent; trashed?: boolean },
) {
  const encryptedData = changes.content && (await encryptNote(vault, noteId, changes.content));
  const send = (baseVersion: number) =>
    withRetry(() =>
      updateNoteRecord(vault.token, vault.workspaceId, noteId, {
        baseVersion,
        encryptedData,
        trashed: changes.trashed,
      }),
    );

  const note = requireNote(vault, noteId);
  try {
    return applyRecord(vault, note, await send(note.version));
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) throw error;
    // another tab or device saved first, or a retried save already landed; this edit is the newest
    const latest = await withRetry(() => getNoteRecord(vault.token, vault.workspaceId, noteId));
    return applyRecord(vault, requireNote(vault, noteId), await send(latest.version));
  }
}

// the note exists locally right away; the server copy is created in the background, even while offline
export function createNote(vault: Vault, content: Partial<NoteContent> = {}) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const noteContent: NoteContent = {
    title: content.title ?? "Untitled",
    content: content.content ?? "",
    isFavorite: content.isFavorite ?? false,
    icon: content.icon,
  };
  const note: VaultNote = {
    ...noteContent,
    id,
    version: 0,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
    revision: 0,
  };
  vault.notes.set(id, note);

  const saved = enqueue(id, async () => {
    const encryptedData = await encryptNote(vault, id, noteContent);
    const record = await withRetry(() =>
      createNoteRecord(vault.token, vault.workspaceId, { id, encryptedData }),
    ).catch((error: unknown) => {
      if (!isStatus(error, 409)) throw error;
      return withRetry(() => getNoteRecord(vault.token, vault.workspaceId, id));
    });
    applyRecord(vault, requireNote(vault, id), record);
  });
  return { note, saved };
}

export function updateNote(vault: Vault, noteId: string, changes: Partial<NoteContent>) {
  // update the cache right away so the ui never shows stale titles while saving
  const note = requireNote(vault, noteId);
  vault.notes.set(noteId, { ...note, ...changes });

  return enqueueLatest(noteId, () => {
    const { title, content, isFavorite, position, icon } = requireNote(vault, noteId);
    return patchNote(vault, noteId, { content: { title, content, isFavorite, position, icon } });
  });
}

export function setNoteTrashed(vault: Vault, noteId: string, trashed: boolean) {
  const note = requireNote(vault, noteId);
  vault.notes.set(noteId, {
    ...note,
    trashedAt: trashed ? (note.trashedAt ?? new Date().toISOString()) : null,
  });
  return enqueue(noteId, () => patchNote(vault, noteId, { trashed }));
}

function forgetNote(vault: Vault, noteId: string) {
  vault.notes.delete(noteId);
  for (const collection of vault.collections.values()) {
    collection.noteIds = collection.noteIds.filter((id) => id !== noteId);
  }
}

export function deleteNote(vault: Vault, noteId: string) {
  forgetNote(vault, noteId);
  return enqueue(noteId, () =>
    withRetry(() => deleteNoteRecord(vault.token, vault.workspaceId, noteId)).catch(
      (error: unknown) => {
        if (!isStatus(error, 404)) throw error;
      },
    ),
  );
}

export function duplicateNote(vault: Vault, noteId: string) {
  const { title, content, icon } = requireNote(vault, noteId);
  return createNote(vault, { title: `${title} copy`, content, icon });
}

export function emptyTrash(vault: Vault) {
  for (const note of [...vault.notes.values()]) {
    if (note.trashedAt !== null) forgetNote(vault, note.id);
  }
  return enqueue("trash", () => withRetry(() => emptyTrashRecords(vault.token, vault.workspaceId)));
}

const positionGap = 1024;

export function placeNotes(vault: Vault, noteIds: string[], placement: Placement) {
  const moving = new Set(noteIds);
  const active = getActiveNotes(vault);
  const moved = active.filter((note) => moving.has(note.id));
  const rest = active.filter((note) => !moving.has(note.id));
  const anchorIndex = rest.findIndex((note) => note.id === placement.anchorId);
  if (anchorIndex === -1 || moved.length === 0) return Promise.resolve([]);

  const index = anchorIndex + (placement.side === "after" ? 1 : 0);
  const previous = rest[index - 1];
  const next = rest[index];
  const span = positionGap * (moved.length + 1);
  const low = previous ? getSortKey(previous) : getSortKey(next) - span;
  const high = next ? getSortKey(next) : getSortKey(previous) + span;
  const step = (high - low) / (moved.length + 1);
  const positions = moved.map((_, i) => low + step * (i + 1));

  if (positions.every((position, i) => position > (positions[i - 1] ?? low) && position < high)) {
    return Promise.all(moved.map((note, i) => updateNote(vault, note.id, { position: positions[i] })));
  }

  // repeated inserts at one spot run out of float precision, so space the whole list out again
  const ordered = [...rest.slice(0, index), ...moved, ...rest.slice(index)];
  return Promise.all(
    ordered.map((note, i) => updateNote(vault, note.id, { position: (i + 1) * positionGap })),
  );
}
