import * as opaque from "@serenity-kit/opaque";

import type { UnlockedAccount } from "~/lib/account/unlocked-account";
import { type KeyStretching, registerFinish, registerStart } from "~/lib/api/auth";
import { createNoteRecord } from "~/lib/api/notes";
import {
  deriveAccountUnlockKey,
  generateKeyPair,
  generateWorkspaceKey,
  sealWorkspaceKey,
  toPasswordInput,
} from "~/lib/crypto/account-keys";
import { contexts } from "~/lib/crypto/contexts";
import { toBase64Url } from "~/lib/crypto/encoding";
import { sealEnvelope, sealJson } from "~/lib/crypto/envelope";
import { generateSecretKey } from "~/lib/crypto/secret-key";
import { encryptNote } from "~/lib/vault/codec";
import { welcomeNote } from "~/lib/vault/welcome-note";

const keyStretching: KeyStretching = "memory-constrained";
const defaultWorkspaceName = "My workspace";

export async function signUp(username: string, password: string) {
  await opaque.ready;
  const secretKey = generateSecretKey();
  const passwordInput = toPasswordInput(secretKey, password);

  const start = opaque.client.startRegistration({ password: passwordInput });
  const { registrationResponse } = await registerStart({
    username,
    registrationRequest: start.registrationRequest,
  });
  const registration = opaque.client.finishRegistration({
    password: passwordInput,
    registrationResponse,
    clientRegistrationState: start.clientRegistrationState,
    keyStretching,
  });

  const accountUnlockKey = await deriveAccountUnlockKey(registration.exportKey);
  const { publicKey, privateKey } = await generateKeyPair();
  const workspaceId = crypto.randomUUID();
  const workspaceKey = await generateWorkspaceKey();

  const { userId, session } = await registerFinish({
    username,
    registrationRecord: registration.registrationRecord,
    keyStretching,
    publicKey: toBase64Url(publicKey),
    encryptedPrivateKey: toBase64Url(
      await sealEnvelope(accountUnlockKey, privateKey, contexts.privateKey(username)),
    ),
    workspace: {
      id: workspaceId,
      encryptedName: toBase64Url(
        await sealJson(workspaceKey, { name: defaultWorkspaceName }, contexts.workspaceName(workspaceId)),
      ),
      encryptedWorkspaceKey: toBase64Url(await sealWorkspaceKey(workspaceId, workspaceKey, publicKey)),
    },
  });

  const welcomeNoteId = crypto.randomUUID();
  await createNoteRecord(session.token, workspaceId, {
    id: welcomeNoteId,
    encryptedData: await encryptNote({ workspaceId, workspaceKey }, welcomeNoteId, welcomeNote),
  });

  const account: UnlockedAccount = {
    session,
    user: { id: userId, username, publicKey },
    privateKey,
    workspaces: [{ id: workspaceId, role: "owner", name: defaultWorkspaceName, key: workspaceKey }],
  };

  return { account, secretKey };
}
