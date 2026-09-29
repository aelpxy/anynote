import * as opaque from "@serenity-kit/opaque";

import { unlockAccount } from "~/lib/account/unlocked-account";
import { loginFinish, loginStart } from "~/lib/api/auth";
import { deriveAccountUnlockKey, toPasswordInput } from "~/lib/crypto/account-keys";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Wrong username, password or Secret Key.");
  }
}

export async function signIn(username: string, password: string, secretKey: string) {
  await opaque.ready;
  const passwordInput = toPasswordInput(secretKey, password);

  const start = opaque.client.startLogin({ password: passwordInput });
  const { loginId, credentialResponse, keyStretching } = await loginStart({
    username,
    credentialRequest: start.startLoginRequest,
  });
  const login = opaque.client.finishLogin({
    clientLoginState: start.clientLoginState,
    loginResponse: credentialResponse,
    password: passwordInput,
    keyStretching,
  });
  // opaque can't tell which part was wrong, and neither should the ui
  if (!login) throw new InvalidCredentialsError();

  const { session, account } = await loginFinish({
    loginId,
    credentialFinalization: login.finishLoginRequest,
  });
  return unlockAccount(session, account, await deriveAccountUnlockKey(login.exportKey));
}
