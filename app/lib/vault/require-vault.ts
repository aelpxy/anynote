import { redirectToUnlock, requireAccount } from "~/lib/account/session";
import { getCurrentWorkspace, setAccount } from "~/lib/account/session-store";
import { ApiError } from "~/lib/api/client";
import { loadVault } from "~/lib/vault/load";

export async function requireVault(request: Request) {
  const account = await requireAccount(request);
  try {
    return await loadVault(account, getCurrentWorkspace(account));
  } catch (error) {
    // a restored session can be expired or revoked from another device
    if (error instanceof ApiError && error.status === 401) {
      setAccount(null);
      throw redirectToUnlock(request);
    }
    throw error;
  }
}
