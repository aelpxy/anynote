import { useSyncExternalStore } from "react";

import { getConnectionState, subscribeToConnection } from "~/lib/vault/connection";

export function useConnection() {
  return useSyncExternalStore(subscribeToConnection, getConnectionState, getConnectionState);
}
