import { redirect } from "react-router";

import { forgetDevice, getRememberedDevice } from "~/lib/account/device";
import { getAccount, restoreAccount, setAccount } from "~/lib/account/session-store";
import { logout } from "~/lib/api/auth";

export function getSafeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function redirectToUnlock(request: Request) {
  const url = new URL(request.url);
  const next = encodeURIComponent(`${url.pathname}${url.search}${url.hash}`);
  return redirect(`${getRememberedDevice() ? "/unlock" : "/signin"}?next=${next}`);
}

export async function requireAccount(request: Request) {
  await restoreAccount();
  const account = getAccount();
  if (account) return account;
  throw redirectToUnlock(request);
}

export async function lockAccount() {
  const account = getAccount();
  setAccount(null);
  // the session is useless without the keys, so end it on the server too
  if (account) await logout(account.session.token).catch(() => undefined);
}

export async function signOut() {
  await lockAccount();
  forgetDevice();
}
