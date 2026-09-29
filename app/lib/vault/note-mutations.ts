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
import { getActiveNotes, getSortKey } from "~/lib/vault/queries";
import { enqueue } from "~/lib/vault/queue";
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
  const send = async (baseVersion: number) =>
    updateNoteRecord(vault.token, vault.workspaceId, noteId, {
      baseVersion,
      encryptedData: changes.content && (await encryptNote(vault, noteId, changes.content)),
      trashed: changes.trashed,
    });

  const note = requireNote(vault, noteId);
  try {
    return applyRecord(vault, note, await send(note.version));
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) throw error;
    // another tab or device saved first; this edit is the newer one, so apply it on top
    const latest = await getNoteRecord(vault.token, vault.workspaceId, noteId);
    return applyRecord(vault, requireNote(vault, noteId), await send(latest.version));
  }
}

export async function createNote(vault: Vault, content: Partial<NoteContent> = {}) {
  const id = crypto.randomUUID();
  const noteContent: NoteContent = {
    title: content.title ?? "Untitled",
    content: content.content ?? "",
    isFavorite: content.isFavorite ?? false,
  };

  const record = await createNoteRecord(vault.token, vault.workspaceId, {
    id,
    encryptedData: await encryptNote(vault, id, noteContent),
  });
  const note: VaultNote = {
    ...noteContent,
    id,
    version: record.version,
    trashedAt: record.trashedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    revision: 0,
  };
  vault.notes.set(id, note);
  return note;
}

export function updateNote(vault: Vault, noteId: string, changes: Partial<NoteContent>) {
  // update the cache right away so the ui never shows stale titles while saving
  const note = requireNote(vault, noteId);
  vault.notes.set(noteId, { ...note, ...changes });

  return enqueue(noteId, () => {
    const { title, content, isFavorite, position } = requireNote(vault, noteId);
    return patchNote(vault, noteId, { content: { title, content, isFavorite, position } });
  });
}

export function setNoteTrashed(vault: Vault, noteId: string, trashed: boolean) {
  return enqueue(noteId, () => patchNote(vault, noteId, { trashed }));
}

export function deleteNote(vault: Vault, noteId: string) {
  return enqueue(noteId, async () => {
    await deleteNoteRecord(vault.token, vault.workspaceId, noteId);
    vault.notes.delete(noteId);
    for (const collection of vault.collections.values()) {
      collection.noteIds = collection.noteIds.filter((id) => id !== noteId);
    }
  });
}

export function duplicateNote(vault: Vault, noteId: string) {
  const { title, content } = requireNote(vault, noteId);
  return createNote(vault, { title: `${title} copy`, content });
}

export async function emptyTrash(vault: Vault) {
  await emptyTrashRecords(vault.token, vault.workspaceId);
  for (const note of [...vault.notes.values()]) {
    if (note.trashedAt === null) continue;
    vault.notes.delete(note.id);
    for (const collection of vault.collections.values()) {
      collection.noteIds = collection.noteIds.filter((id) => id !== note.id);
    }
  }
}

const positionGap = 1024;

export async function placeNotes(vault: Vault, noteIds: string[], placement: Placement) {
  const moving = new Set(noteIds);
  const active = getActiveNotes(vault);
  const moved = active.filter((note) => moving.has(note.id));
  const rest = active.filter((note) => !moving.has(note.id));
  const anchorIndex = rest.findIndex((note) => note.id === placement.anchorId);
  if (anchorIndex === -1 || moved.length === 0) return;

  const index = anchorIndex + (placement.side === "after" ? 1 : 0);
  const previous = rest[index - 1];
  const next = rest[index];
  const span = positionGap * (moved.length + 1);
  const low = previous ? getSortKey(previous) : getSortKey(next) - span;
  const high = next ? getSortKey(next) : getSortKey(previous) + span;
  const step = (high - low) / (moved.length + 1);
  const positions = moved.map((_, i) => low + step * (i + 1));

  if (positions.every((position, i) => position > (positions[i - 1] ?? low) && position < high)) {
    await Promise.all(moved.map((note, i) => updateNote(vault, note.id, { position: positions[i] })));
    return;
  }

  // repeated inserts at one spot run out of float precision, so space the whole list out again
  const ordered = [...rest.slice(0, index), ...moved, ...rest.slice(index)];
  await Promise.all(
    ordered.map((note, i) => updateNote(vault, note.id, { position: (i + 1) * positionGap })),
  );
}
