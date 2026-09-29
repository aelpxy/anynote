import type { UnlockedAccount } from "~/lib/account/unlocked-account";
import { deleteStoredKey, getStoredKey, storeKey } from "~/lib/browser/key-store";
import { concatBytes, fromBase64Url, fromUtf8, toBase64Url, toUtf8 } from "~/lib/crypto/encoding";

const storageKey = "anynote:unlocked";
const keyName = "unlocked-account";

type PersistedAccount = {
  session: UnlockedAccount["session"];
  user: { id: string; username: string; publicKey: string };
  privateKey: string;
  workspaces: { id: string; role: UnlockedAccount["workspaces"][number]["role"]; name: string; key: string }[];
  currentWorkspaceId: string | null;
};

function serialize(account: UnlockedAccount, currentWorkspaceId: string | null): PersistedAccount {
  return {
    session: account.session,
    user: { ...account.user, publicKey: toBase64Url(account.user.publicKey) },
    privateKey: toBase64Url(account.privateKey),
    workspaces: account.workspaces.map((workspace) => ({ ...workspace, key: toBase64Url(workspace.key) })),
    currentWorkspaceId,
  };
}

function deserialize(persisted: PersistedAccount) {
  const account: UnlockedAccount = {
    session: persisted.session,
    user: { ...persisted.user, publicKey: fromBase64Url(persisted.user.publicKey) },
    privateKey: fromBase64Url(persisted.privateKey),
    workspaces: persisted.workspaces.map((workspace) => ({
      ...workspace,
      key: fromBase64Url(workspace.key),
    })),
  };
  return { account, currentWorkspaceId: persisted.currentWorkspaceId };
}

// a non-extractable key can encrypt and decrypt in this browser but can never be read out by page code
async function getOrCreateKey() {
  const existing = await getStoredKey(keyName);
  if (existing) return existing;

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
  await storeKey(keyName, key);
  return key;
}

export async function persistAccount(account: UnlockedAccount, currentWorkspaceId: string | null) {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = toUtf8(JSON.stringify(serialize(account, currentWorkspaceId)));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));
  localStorage.setItem(storageKey, toBase64Url(concatBytes(iv, ciphertext)));
}

export async function restorePersistedAccount() {
  const stored = localStorage.getItem(storageKey);
  const key = stored ? await getStoredKey(keyName) : undefined;
  if (!stored || !key) return null;

  try {
    const bytes = fromBase64Url(stored);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.subarray(0, 12) },
      key,
      bytes.subarray(12),
    );
    const restored = deserialize(JSON.parse(fromUtf8(new Uint8Array(plaintext))) as PersistedAccount);
    return new Date(restored.account.session.expiresAt) > new Date() ? restored : null;
  } catch {
    return null;
  }
}

export async function clearPersistedAccount() {
  localStorage.removeItem(storageKey);
  await deleteStoredKey(keyName).catch(() => undefined);
}

export function isPersistedAccountKey(key: string | null) {
  return key === storageKey;
}
