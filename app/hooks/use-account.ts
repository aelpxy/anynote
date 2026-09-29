import { useSyncExternalStore } from "react";

import { getAccount, subscribeToAccount } from "~/lib/account/session-store";

export function useAccount() {
  return useSyncExternalStore(subscribeToAccount, getAccount, () => null);
}
