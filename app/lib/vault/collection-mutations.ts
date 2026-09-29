import {
  addNoteToCollectionRecord,
  createCollectionRecord,
  deleteCollectionRecord,
  removeNoteFromCollectionRecord,
  reorderCollectionNoteRecords,
  reorderCollectionRecords,
  updateCollectionRecord,
} from "~/lib/api/collections";
import { encryptCollectionName } from "~/lib/vault/codec";
import { trackCollectionWrite } from "~/lib/vault/collection-writes";
import { isStatus, withRetry } from "~/lib/vault/connection";
import type { Placement, Vault } from "~/lib/vault/types";

function requireCollection(vault: Vault, collectionId: string) {
  const collection = vault.collections.get(collectionId);
  if (!collection) throw new Response("Collection not found", { status: 404 });
  return collection;
}

function getSubtreeIds(vault: Vault, collectionId: string): string[] {
  const children = [...vault.collections.values()].filter(
    (collection) => collection.parentId === collectionId,
  );
  return [collectionId, ...children.flatMap((child) => getSubtreeIds(vault, child.id))];
}

export function createCollection(vault: Vault, parentId: string | null) {
  const id = crypto.randomUUID();
  const name = "Untitled collection";
  const siblings = [...vault.collections.values()].filter(
    (collection) => collection.parentId === parentId,
  );
  const position = Math.max(0, ...siblings.map((collection) => collection.position + 1));
  vault.collections.set(id, { id, parentId, name, position, noteIds: [] });

  return trackCollectionWrite(async () => {
    const encryptedName = await encryptCollectionName(vault, id, name);
    await withRetry(() =>
      createCollectionRecord(vault.token, vault.workspaceId, { id, parentId, encryptedName, position }),
    ).catch((error: unknown) => {
      // a retry after a lost response finds the collection already created
      if (!isStatus(error, 409)) throw error;
    });
  });
}

export function renameCollection(vault: Vault, collectionId: string, name: string) {
  const collection = requireCollection(vault, collectionId);
  vault.collections.set(collectionId, { ...collection, name });
  return trackCollectionWrite(async () => {
    const encryptedName = await encryptCollectionName(vault, collectionId, name);
    await withRetry(() =>
      updateCollectionRecord(vault.token, vault.workspaceId, collectionId, { encryptedName }),
    );
  });
}

function setParent(vault: Vault, collectionId: string, parentId: string | null) {
  const collection = requireCollection(vault, collectionId);
  if (parentId && getSubtreeIds(vault, collectionId).includes(parentId)) {
    throw new Response("A collection can't be moved into itself", { status: 400 });
  }
  const siblings = [...vault.collections.values()].filter(
    (sibling) => sibling.parentId === parentId,
  );
  const position = Math.max(0, ...siblings.map((sibling) => sibling.position + 1));
  vault.collections.set(collectionId, { ...collection, parentId, position });
  return position;
}

export function moveCollection(vault: Vault, collectionId: string, parentId: string | null) {
  const position = setParent(vault, collectionId, parentId);
  return trackCollectionWrite(() =>
    withRetry(() =>
      updateCollectionRecord(vault.token, vault.workspaceId, collectionId, { parentId, position }),
    ),
  );
}

export function deleteCollection(vault: Vault, collectionId: string) {
  for (const id of getSubtreeIds(vault, requireCollection(vault, collectionId).id)) {
    vault.collections.delete(id);
  }
  return trackCollectionWrite(() =>
    withRetry(() => deleteCollectionRecord(vault.token, vault.workspaceId, collectionId)).catch(
      (error: unknown) => {
        if (!isStatus(error, 404)) throw error;
      },
    ),
  );
}

function addNoteLocally(vault: Vault, collectionId: string, noteId: string) {
  const collection = requireCollection(vault, collectionId);
  if (collection.noteIds.includes(noteId)) return;
  vault.collections.set(collectionId, { ...collection, noteIds: [...collection.noteIds, noteId] });
}

export function addNoteToCollection(vault: Vault, collectionId: string, noteId: string) {
  addNoteLocally(vault, collectionId, noteId);
  return trackCollectionWrite(() =>
    withRetry(() => addNoteToCollectionRecord(vault.token, vault.workspaceId, collectionId, noteId)),
  );
}

export function removeNoteFromCollection(vault: Vault, collectionId: string, noteId: string) {
  const collection = requireCollection(vault, collectionId);
  vault.collections.set(collectionId, {
    ...collection,
    noteIds: collection.noteIds.filter((id) => id !== noteId),
  });
  return trackCollectionWrite(() =>
    withRetry(() =>
      removeNoteFromCollectionRecord(vault.token, vault.workspaceId, collectionId, noteId),
    ),
  );
}

function insertAt<T>(items: T[], moved: T[], index: number) {
  return [...items.slice(0, index), ...moved, ...items.slice(index)];
}

export function placeCollection(vault: Vault, collectionId: string, placement: Placement) {
  const { parentId } = requireCollection(vault, placement.anchorId);
  const parentChanged = requireCollection(vault, collectionId).parentId !== parentId;
  if (parentChanged) setParent(vault, collectionId, parentId);

  const siblingIds = [...vault.collections.values()]
    .filter((collection) => collection.parentId === parentId && collection.id !== collectionId)
    .sort((a, b) => a.position - b.position)
    .map((collection) => collection.id);
  const anchorIndex = siblingIds.indexOf(placement.anchorId);
  const ids = insertAt(siblingIds, [collectionId], anchorIndex + (placement.side === "after" ? 1 : 0));
  ids.forEach((id, position) => {
    vault.collections.set(id, { ...requireCollection(vault, id), position });
  });

  return trackCollectionWrite(async () => {
    if (parentChanged) {
      await withRetry(() =>
        updateCollectionRecord(vault.token, vault.workspaceId, collectionId, { parentId }),
      );
    }
    await withRetry(() => reorderCollectionRecords(vault.token, vault.workspaceId, ids));
  });
}

export function placeNotesInCollection(
  vault: Vault,
  collectionId: string,
  noteIds: string[],
  placement?: Placement,
) {
  for (const noteId of noteIds) addNoteLocally(vault, collectionId, noteId);

  const collection = requireCollection(vault, collectionId);
  const moving = new Set(noteIds);
  const rest = collection.noteIds.filter((id) => !moving.has(id));
  const anchorIndex = placement ? rest.indexOf(placement.anchorId) : -1;
  const ordered =
    placement && anchorIndex !== -1
      ? insertAt(
          rest,
          collection.noteIds.filter((id) => moving.has(id)),
          anchorIndex + (placement.side === "after" ? 1 : 0),
        )
      : null;
  if (ordered) vault.collections.set(collectionId, { ...collection, noteIds: ordered });

  return trackCollectionWrite(async () => {
    // one at a time so the server appends them in order
    for (const noteId of noteIds) {
      await withRetry(() =>
        addNoteToCollectionRecord(vault.token, vault.workspaceId, collectionId, noteId),
      );
    }
    if (ordered) {
      await withRetry(() =>
        reorderCollectionNoteRecords(vault.token, vault.workspaceId, collectionId, ordered),
      );
    }
  });
}
