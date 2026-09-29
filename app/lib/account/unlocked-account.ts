import type { AccountResponse, Session } from "~/lib/api/auth";
import { openWorkspaceKey } from "~/lib/crypto/account-keys";
import { contexts } from "~/lib/crypto/contexts";
import { fromBase64Url } from "~/lib/crypto/encoding";
import { openEnvelope, openJson } from "~/lib/crypto/envelope";

export type UnlockedWorkspace = {
  id: string;
  role: "owner" | "editor" | "viewer";
  name: string;
  key: Uint8Array;
};

export type UnlockedAccount = {
  session: Session;
  user: { id: string; username: string; publicKey: Uint8Array };
  privateKey: Uint8Array;
  workspaces: UnlockedWorkspace[];
};

export async function unlockAccount(
  session: Session,
  account: AccountResponse,
  accountUnlockKey: Uint8Array,
): Promise<UnlockedAccount> {
  const { user } = account;
  const publicKey = fromBase64Url(user.publicKey);
  const privateKey = await openEnvelope(
    accountUnlockKey,
    fromBase64Url(user.encryptedPrivateKey),
    contexts.privateKey(user.username),
  );

  const workspaces = await Promise.all(
    account.workspaces.map(async (workspace) => {
      const key = await openWorkspaceKey(
        workspace.id,
        fromBase64Url(workspace.encryptedWorkspaceKey),
        publicKey,
        privateKey,
      );
      const { name } = await openJson<{ name: string }>(
        key,
        fromBase64Url(workspace.encryptedName),
        contexts.workspaceName(workspace.id),
      );
      return { id: workspace.id, role: workspace.role, name, key };
    }),
  );

  return {
    session,
    user: { id: user.id, username: user.username, publicKey },
    privateKey,
    workspaces,
  };
}
