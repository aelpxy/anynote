import { useSyncExternalStore } from "react";

import { isExpanded, setExpanded, subscribeToExpansion } from "~/lib/ui/sidebar-expansion";

export function useExpanded(id: string, fallback: boolean) {
  const open = useSyncExternalStore(
    subscribeToExpansion,
    () => isExpanded(id, fallback),
    () => fallback,
  );
  return [open, (next: boolean) => setExpanded(id, next)] as const;
}
