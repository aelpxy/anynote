import type { CollectionRecord } from "~/lib/api/collections";
import type { NoteRecord } from "~/lib/api/notes";
import { contexts } from "~/lib/crypto/contexts";
import { fromBase64Url, toBase64Url } from "~/lib/crypto/encoding";
import { openJson, sealJson } from "~/lib/crypto/envelope";
import type { NoteContent, Vault, VaultCollection, VaultNote } from "~/lib/vault/types";

type Keys = Pick<Vault, "workspaceId" | "workspaceKey">;

export async function encryptNote(keys: Keys, noteId: string, content: NoteContent) {
  return toBase64Url(
    await sealJson(keys.workspaceKey, content, contexts.note(keys.workspaceId, noteId)),
  );
}

export async function decryptNote(keys: Keys, record: NoteRecord): Promise<VaultNote> {
  const content = await openJson<NoteContent>(
    keys.workspaceKey,
    fromBase64Url(record.encryptedData),
    contexts.note(keys.workspaceId, record.id),
  );
  return {
    id: record.id,
    title: content.title,
    content: content.content,
    isFavorite: content.isFavorite,
    version: record.version,
    trashedAt: record.trashedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    revision: 0,
  };
}

export async function encryptCollectionName(keys: Keys, collectionId: string, name: string) {
  return toBase64Url(
    await sealJson(keys.workspaceKey, { name }, contexts.collection(keys.workspaceId, collectionId)),
  );
}

export async function decryptCollection(keys: Keys, record: CollectionRecord): Promise<VaultCollection> {
  const { name } = await openJson<{ name: string }>(
    keys.workspaceKey,
    fromBase64Url(record.encryptedName),
    contexts.collection(keys.workspaceId, record.id),
  );
  return {
    id: record.id,
    parentId: record.parentId,
    name,
    position: record.position,
    noteIds: record.noteIds,
  };
}
