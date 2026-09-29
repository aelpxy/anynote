import type { UnlockedAccount, UnlockedWorkspace } from "~/lib/account/unlocked-account";
import { getChangesCursor } from "~/lib/api/changes";
import { listCollections } from "~/lib/api/collections";
import { listNotes } from "~/lib/api/notes";
import { sweepUnusedAttachments } from "~/lib/vault/attachment-sweep";
import { decryptCollection, decryptNote } from "~/lib/vault/codec";
import { getVault, setVault } from "~/lib/vault/store";
import type { Vault } from "~/lib/vault/types";

export async function decryptAll<T, R>(items: T[], decrypt: (item: T) => Promise<R>) {
  const results = await Promise.allSettled(items.map(decrypt));
  return results.flatMap((result) => {
    // a tampered or foreign ciphertext fails authentication; skip it instead of breaking the workspace
    if (result.status === "rejected") {
      console.error("Skipped an item that failed to decrypt", result.reason);
      return [];
    }
    return [result.value];
  });
}

const pendingLoads = new Map<string, Promise<Vault>>();

export async function loadVault(account: UnlockedAccount, workspace: UnlockedWorkspace) {
  const current = getVault();
  if (current?.workspaceId === workspace.id && current.token === account.session.token) {
    return current;
  }

  // parallel route loaders share one fetch and decrypt pass
  const key = `${account.session.token}:${workspace.id}`;
  let pending = pendingLoads.get(key);
  if (!pending) {
    pending = fetchVault(account, workspace).finally(() => pendingLoads.delete(key));
    pendingLoads.set(key, pending);
  }
  return pending;
}

async function fetchVault(account: UnlockedAccount, workspace: UnlockedWorkspace) {
  const token = account.session.token;
  const keys = { workspaceId: workspace.id, workspaceKey: workspace.key };
  // read the cursor first so nothing written during the load is missed by the next sync
  const { cursor } = await getChangesCursor(token, workspace.id);
  const [noteRecords, collectionRecords] = await Promise.all([
    listNotes(token, workspace.id),
    listCollections(token, workspace.id),
  ]);
  const [notes, collections] = await Promise.all([
    decryptAll(noteRecords, (record) => decryptNote(keys, record)),
    decryptAll(collectionRecords, (record) => decryptCollection(keys, record)),
  ]);

  const vault: Vault = {
    token,
    cursor,
    ...keys,
    notes: new Map(notes.map((note) => [note.id, note])),
    collections: new Map(collections.map((collection) => [collection.id, collection])),
  };
  setVault(vault);
  void sweepUnusedAttachments(vault);
  return vault;
}
