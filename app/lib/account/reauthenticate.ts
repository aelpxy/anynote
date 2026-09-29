import { getRememberedDevice } from "~/lib/account/device";
import { updateAccount } from "~/lib/account/session-store";
import { signIn } from "~/lib/account/sign-in";
import type { UnlockedAccount } from "~/lib/account/unlocked-account";
import { logout } from "~/lib/api/auth";
import { getVault } from "~/lib/vault/store";

// a fresh login proves the password right now; the server only allows sensitive changes on fresh sessions
export async function reauthenticate(account: UnlockedAccount, password: string) {
  const device = getRememberedDevice();
  if (!device || device.username !== account.user.username) {
    throw new Error("Sign in again on this device first.");
  }

  const fresh = await signIn(account.user.username, password, device.secretKey);
  updateAccount((current) => ({ ...current, session: fresh.session }));
  const vault = getVault();
  if (vault) vault.token = fresh.session.token;
  await logout(account.session.token).catch(() => undefined);

  return { secretKey: device.secretKey, session: fresh.session };
}
