import {
  addNoteToCollectionRecord,
  createCollectionRecord,
  deleteCollectionRecord,
  removeNoteFromCollectionRecord,
  updateCollectionRecord,
} from "~/lib/api/collections";
import { encryptCollectionName } from "~/lib/vault/codec";
import type { Vault } from "~/lib/vault/types";

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
  await createCollectionRecord(vault.token, vault.workspaceId, {
    id,
    parentId,
    encryptedName: await encryptCollectionName(vault, id, name),
  });

  const siblings = [...vault.collections.values()].filter(
    (collection) => collection.parentId === parentId,
  );
  vault.collections.set(id, {
    id,
    parentId,
    name,
    position: Math.max(0, ...siblings.map((collection) => collection.position + 1)),
    noteIds: [],
  });
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
