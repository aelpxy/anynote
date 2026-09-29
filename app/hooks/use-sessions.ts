import { useCallback, useEffect, useState } from "react";

import { useAccount } from "~/hooks/use-account";
import { listSessions, type SessionSummary } from "~/lib/api/sessions";

export function useSessions() {
  const account = useAccount();
  const token = account?.session.token;
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  const reload = useCallback(async () => {
    if (token) setSessions(await listSessions(token));
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sessions, reload };
}
