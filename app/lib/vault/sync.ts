import { listChanges } from "~/lib/api/changes";
import { listCollections } from "~/lib/api/collections";
import { ApiError } from "~/lib/api/client";
import { getNoteRecord } from "~/lib/api/notes";
import { decryptCollection, decryptNote } from "~/lib/vault/codec";
import { decryptAll } from "~/lib/vault/load";
import { isPending } from "~/lib/vault/queue";
import type { Vault } from "~/lib/vault/types";

async function applyNoteChange(vault: Vault, noteId: string, operation: "upsert" | "delete") {
  // local edits in flight win; they resolve conflicts themselves when they save
  if (isPending(noteId)) return false;

  if (operation === "delete") return vault.notes.delete(noteId);

  try {
    const remote = await decryptNote(vault, await getNoteRecord(vault.token, vault.workspaceId, noteId));
    const local = vault.notes.get(noteId);
    if (local && local.version >= remote.version) return false;

    const contentChanged = !local || local.content !== remote.content || local.title !== remote.title;
    vault.notes.set(noteId, { ...remote, revision: (local?.revision ?? 0) + (contentChanged ? 1 : 0) });
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return vault.notes.delete(noteId);
    throw error;
  }
}

async function reloadCollections(vault: Vault) {
  const records = await listCollections(vault.token, vault.workspaceId);
  const collections = await decryptAll(records, (record) => decryptCollection(vault, record));
  vault.collections = new Map(collections.map((collection) => [collection.id, collection]));
}

// pulls everything written by other tabs and devices since the last sync; returns whether anything changed
export async function syncVault(vault: Vault) {
  let changed = false;
  let hasMore = true;

  while (hasMore) {
    const page = await listChanges(vault.token, vault.workspaceId, vault.cursor);
    const latestByNote = new Map<string, "upsert" | "delete">();
    let collectionsChanged = false;

    for (const change of page.changes) {
      if (change.entity === "note") latestByNote.set(change.entityId, change.operation);
      if (change.entity === "collection") collectionsChanged = true;
    }
    for (const [noteId, operation] of latestByNote) {
      if (await applyNoteChange(vault, noteId, operation)) changed = true;
    }
    if (collectionsChanged) {
      await reloadCollections(vault);
      changed = true;
    }

    vault.cursor = page.cursor;
    hasMore = page.hasMore;
  }

  return changed;
}
