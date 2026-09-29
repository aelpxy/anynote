import { useEffect } from "react";

import { getConnectionState } from "~/lib/vault/connection";

// unsynced writes only live in this tab's memory, so closing it would lose them
export function useUnsyncedChangesWarning() {
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (getConnectionState().pendingWrites > 0) event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
}
