import {
  clearPersistedAccount,
  persistAccount,
  restorePersistedAccount,
} from "~/lib/account/persisted-account";
import type { UnlockedAccount } from "~/lib/account/unlocked-account";
import { revokeAttachmentUrls } from "~/lib/vault/attachments";
import { setVault } from "~/lib/vault/store";

let account: UnlockedAccount | null = null;
let currentWorkspaceId: string | null = null;
let restoration: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

// keeps the unlocked account across reloads and tabs until lock or log out
function persist() {
  if (typeof window === "undefined") return;
  const saved = account
    ? persistAccount(account, currentWorkspaceId)
    : clearPersistedAccount();
  saved.catch((error: unknown) => console.error("Couldn't save the unlocked session", error));
}

export function restoreAccount() {
  if (typeof window === "undefined") return Promise.resolve();
  restoration ??= restorePersistedAccount().then((restored) => {
    if (!restored || account) return;
    account = restored.account;
    currentWorkspaceId = restored.currentWorkspaceId ?? restored.account.workspaces[0]?.id ?? null;
    notify();
  });
  return restoration;
}

export function getAccount() {
  return account;
}

export function setAccount(next: UnlockedAccount | null) {
  account = next;
  currentWorkspaceId = next?.workspaces[0]?.id ?? null;
  setVault(null);
  revokeAttachmentUrls();
  persist();
  notify();
}

export function updateAccount(update: (current: UnlockedAccount) => UnlockedAccount) {
  if (!account) return;
  account = update(account);
  persist();
  notify();
}

export function getCurrentWorkspace(unlocked: UnlockedAccount) {
  const workspace =
    unlocked.workspaces.find(({ id }) => id === currentWorkspaceId) ?? unlocked.workspaces[0];
  if (!workspace) throw new Error("This account has no workspace");
  return workspace;
}

export function getCurrentWorkspaceId() {
  return currentWorkspaceId;
}

export function setCurrentWorkspace(workspaceId: string) {
  currentWorkspaceId = workspaceId;
  persist();
  notify();
}

export function subscribeToAccount(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
