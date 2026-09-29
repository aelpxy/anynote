import {
  getCurrentWorkspaceId,
  setCurrentWorkspace,
  updateAccount,
} from "~/lib/account/session-store";
import type { UnlockedAccount, UnlockedWorkspace } from "~/lib/account/unlocked-account";
import {
  createWorkspaceRecord,
  deleteWorkspaceRecord,
  renameWorkspaceRecord,
} from "~/lib/api/workspaces";
import { generateWorkspaceKey, sealWorkspaceKey } from "~/lib/crypto/account-keys";
import { contexts } from "~/lib/crypto/contexts";
import { toBase64Url } from "~/lib/crypto/encoding";
import { sealJson } from "~/lib/crypto/envelope";

async function encryptWorkspaceName(workspaceId: string, workspaceKey: Uint8Array, name: string) {
  return toBase64Url(
    await sealJson(workspaceKey, { name }, contexts.workspaceName(workspaceId)),
  );
}

export async function createWorkspace(account: UnlockedAccount, name: string) {
  const id = crypto.randomUUID();
  const key = await generateWorkspaceKey();

  await createWorkspaceRecord(account.session.token, {
    id,
    encryptedName: await encryptWorkspaceName(id, key, name),
    encryptedWorkspaceKey: toBase64Url(await sealWorkspaceKey(id, key, account.user.publicKey)),
  });

  const workspace: UnlockedWorkspace = { id, role: "owner", name, key };
  updateAccount((current) => ({ ...current, workspaces: [...current.workspaces, workspace] }));
  return workspace;
}

export async function renameWorkspace(account: UnlockedAccount, workspace: UnlockedWorkspace, name: string) {
  await renameWorkspaceRecord(
    account.session.token,
    workspace.id,
    await encryptWorkspaceName(workspace.id, workspace.key, name),
  );
  updateAccount((current) => ({
    ...current,
    workspaces: current.workspaces.map((item) => (item.id === workspace.id ? { ...item, name } : item)),
  }));
}

export async function deleteWorkspace(account: UnlockedAccount, workspaceId: string) {
  await deleteWorkspaceRecord(account.session.token, workspaceId);
  const remaining = account.workspaces.filter(({ id }) => id !== workspaceId);
  updateAccount((current) => ({ ...current, workspaces: remaining }));
  if (getCurrentWorkspaceId() === workspaceId && remaining[0]) {
    setCurrentWorkspace(remaining[0].id);
  }
}
