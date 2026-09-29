import * as opaque from "@serenity-kit/opaque";

import { forgetDevice } from "~/lib/account/device";
import { reauthenticate } from "~/lib/account/reauthenticate";
import { setAccount } from "~/lib/account/session-store";
import type { UnlockedAccount } from "~/lib/account/unlocked-account";
import {
  deleteAccountRecord,
  type KeyStretching,
  passwordFinish,
  passwordStart,
} from "~/lib/api/auth";
import { deriveAccountUnlockKey, toPasswordInput } from "~/lib/crypto/account-keys";
import { contexts } from "~/lib/crypto/contexts";
import { toBase64Url } from "~/lib/crypto/encoding";
import { sealEnvelope } from "~/lib/crypto/envelope";

const keyStretching: KeyStretching = "memory-constrained";

export async function changePassword(
  account: UnlockedAccount,
  currentPassword: string,
  newPassword: string,
) {
  await opaque.ready;
  const { secretKey, session } = await reauthenticate(account, currentPassword);
  const passwordInput = toPasswordInput(secretKey, newPassword);

  const start = opaque.client.startRegistration({ password: passwordInput });
  const { registrationResponse } = await passwordStart(session.token, {
    registrationRequest: start.registrationRequest,
  });
  const registration = opaque.client.finishRegistration({
    password: passwordInput,
    registrationResponse,
    clientRegistrationState: start.clientRegistrationState,
    keyStretching,
  });

  // workspace keys are sealed to the keypair, so only the private key needs re-encrypting
  const accountUnlockKey = await deriveAccountUnlockKey(registration.exportKey);
  await passwordFinish(session.token, {
    registrationRecord: registration.registrationRecord,
    keyStretching,
    encryptedPrivateKey: toBase64Url(
      await sealEnvelope(accountUnlockKey, account.privateKey, contexts.privateKey(account.user.username)),
    ),
  });
}

export async function deleteAccount(account: UnlockedAccount, password: string) {
  const { session } = await reauthenticate(account, password);
  await deleteAccountRecord(session.token);
  forgetDevice();
  setAccount(null);
}
