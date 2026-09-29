import { useState } from "react";

import { SecondaryButton } from "~/components/secondary-button";
import { useAccount } from "~/hooks/use-account";
import { useSessions } from "~/hooks/use-sessions";
import { revokeSession } from "~/lib/api/sessions";
import { formatRelativeTime } from "~/lib/relative-time";

export function SessionsList() {
  const account = useAccount();
  const { sessions, reload } = useSessions();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function revoke(sessionId: string) {
    if (!account) return;
    setRevokingId(sessionId);
    try {
      await revokeSession(account.session.token, sessionId);
      await reload();
    } finally {
      setRevokingId(null);
    }
  }

  if (!sessions) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
      {sessions.slice(0, 5).map((session) => (
        <li key={session.id} className="flex items-center justify-between gap-4 py-2 text-sm">
          <div>
            <p className="font-medium">{session.isCurrent ? "This session" : "Other session"}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Active {formatRelativeTime(session.lastUsedAt)}
            </p>
          </div>
          {!session.isCurrent && (
            <SecondaryButton onClick={() => revoke(session.id)} disabled={revokingId === session.id}>
              Sign out
            </SecondaryButton>
          )}
        </li>
      ))}
    </ul>
  );
}
