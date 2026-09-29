import { useSyncExternalStore } from "react";

import { getOpenDialog, subscribeToDialog } from "~/lib/ui/dialog-store";

export function useAppDialog() {
  return useSyncExternalStore(subscribeToDialog, getOpenDialog, () => null);
}
