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

export async function createCollection(vault: Vault, parentId: string | null) {
  const id = crypto.randomUUID();
  const name = "Untitled collection";
  const siblings = [...vault.collections.values()].filter(
    (collection) => collection.parentId === parentId,
  );
  const position = Math.max(0, ...siblings.map((collection) => collection.position + 1));
  await createCollectionRecord(vault.token, vault.workspaceId, {
    id,
    parentId,
    encryptedName: await encryptCollectionName(vault, id, name),
    position,
  });

  vault.collections.set(id, { id, parentId, name, position, noteIds: [] });
}

export async function renameCollection(vault: Vault, collectionId: string, name: string) {
  const collection = requireCollection(vault, collectionId);
  await updateCollectionRecord(vault.token, vault.workspaceId, collectionId, {
    encryptedName: await encryptCollectionName(vault, collectionId, name),
  });
  vault.collections.set(collectionId, { ...collection, name });
}

export async function moveCollection(vault: Vault, collectionId: string, parentId: string | null) {
  const collection = requireCollection(vault, collectionId);
  if (parentId && getSubtreeIds(vault, collectionId).includes(parentId)) {
    throw new Response("A collection can't be moved into itself", { status: 400 });
  }
  await updateCollectionRecord(vault.token, vault.workspaceId, collectionId, { parentId });
  vault.collections.set(collectionId, { ...collection, parentId });
}

export async function deleteCollection(vault: Vault, collectionId: string) {
  const removed = getSubtreeIds(vault, requireCollection(vault, collectionId).id);
  await deleteCollectionRecord(vault.token, vault.workspaceId, collectionId);
  for (const id of removed) vault.collections.delete(id);
}

export async function addNoteToCollection(vault: Vault, collectionId: string, noteId: string) {
  const collection = requireCollection(vault, collectionId);
  await addNoteToCollectionRecord(vault.token, vault.workspaceId, collectionId, noteId);
  if (!collection.noteIds.includes(noteId)) {
    vault.collections.set(collectionId, {
      ...collection,
      noteIds: [...collection.noteIds, noteId],
    });
  }
}

export async function removeNoteFromCollection(vault: Vault, collectionId: string, noteId: string) {
  const collection = requireCollection(vault, collectionId);
  await removeNoteFromCollectionRecord(vault.token, vault.workspaceId, collectionId, noteId);
  vault.collections.set(collectionId, {
    ...collection,
    noteIds: collection.noteIds.filter((id) => id !== noteId),
  });
}

function insertAt<T>(items: T[], moved: T[], index: number) {
  return [...items.slice(0, index), ...moved, ...items.slice(index)];
}

export async function placeCollection(vault: Vault, collectionId: string, placement: Placement) {
  const { parentId } = requireCollection(vault, placement.anchorId);
  if (requireCollection(vault, collectionId).parentId !== parentId) {
    await moveCollection(vault, collectionId, parentId);
  }

  const siblingIds = [...vault.collections.values()]
    .filter((collection) => collection.parentId === parentId && collection.id !== collectionId)
    .sort((a, b) => a.position - b.position)
    .map((collection) => collection.id);
  const anchorIndex = siblingIds.indexOf(placement.anchorId);
  const ids = insertAt(siblingIds, [collectionId], anchorIndex + (placement.side === "after" ? 1 : 0));

  await reorderCollectionRecords(vault.token, vault.workspaceId, ids);
  ids.forEach((id, position) => {
    vault.collections.set(id, { ...requireCollection(vault, id), position });
  });
}

export async function placeNotesInCollection(
  vault: Vault,
  collectionId: string,
  noteIds: string[],
  placement?: Placement,
) {
  // one at a time so the server appends them in order
  for (const noteId of noteIds) await addNoteToCollection(vault, collectionId, noteId);
  if (!placement) return;

  const collection = requireCollection(vault, collectionId);
  const moving = new Set(noteIds);
  const rest = collection.noteIds.filter((id) => !moving.has(id));
  const anchorIndex = rest.indexOf(placement.anchorId);
  if (anchorIndex === -1) return;

  const ordered = insertAt(
    rest,
    collection.noteIds.filter((id) => moving.has(id)),
    anchorIndex + (placement.side === "after" ? 1 : 0),
  );
  await reorderCollectionNoteRecords(vault.token, vault.workspaceId, collectionId, ordered);
  vault.collections.set(collectionId, { ...collection, noteIds: ordered });
}
