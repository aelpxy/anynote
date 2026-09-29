import { useSyncExternalStore } from "react";

import { getLayout, subscribeToLayout } from "~/lib/ui/layout-store";

export function useLayout() {
  return useSyncExternalStore(subscribeToLayout, getLayout, getLayout);
}
