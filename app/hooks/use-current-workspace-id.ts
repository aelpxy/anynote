import { useSyncExternalStore } from "react";

import { getCurrentWorkspaceId, subscribeToAccount } from "~/lib/account/session-store";

export function useCurrentWorkspaceId() {
  return useSyncExternalStore(subscribeToAccount, getCurrentWorkspaceId, () => null);
}
