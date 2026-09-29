import { CloudOff } from "lucide-react";

import { useConnection } from "~/hooks/use-connection";

export function OfflineIndicator() {
  const { isOffline, pendingWrites } = useConnection();
  if (!isOffline) return null;

  return (
    <span
      role="status"
      title="Changes sync when the connection is back. Keep this tab open until then."
      className="mr-1 flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
    >
      <CloudOff className="size-3.5" />
      Offline
      {pendingWrites > 0 && (
        <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">· {pendingWrites} unsynced</span>
      )}
    </span>
  );
}
