import { useEffect, useEffectEvent } from "react";
import { useNavigate, useRevalidator } from "react-router";

import { useAccount } from "~/hooks/use-account";
import { useCurrentWorkspaceId } from "~/hooks/use-current-workspace-id";
import { setAccount } from "~/lib/account/session-store";
import { ApiError } from "~/lib/api/client";
import { streamWorkspaceChanges } from "~/lib/api/events";
import { getVault } from "~/lib/vault/store";
import { syncVault } from "~/lib/vault/sync";

const maxRetryDelayMs = 30_000;

export function useVaultSync() {
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const account = useAccount();
  const workspaceId = useCurrentWorkspaceId();
  const token = account?.session.token;

  const sync = useEffectEvent(async () => {
    const vault = getVault();
    if (!vault) return;
    try {
      if (await syncVault(vault)) await revalidator.revalidate();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAccount(null);
        navigate("/unlock");
        return;
      }
      console.error("Sync failed", error);
    }
  });

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  // changes from other tabs and devices are pushed as they commit
  useEffect(() => {
    if (!token || !workspaceId) return;
    const controller = new AbortController();
    let retryDelay = 1000;
    let pending: ReturnType<typeof setTimeout> | undefined;

    const scheduleSync = () => {
      clearTimeout(pending);
      pending = setTimeout(() => void sync(), 150);
    };

    async function connect() {
      while (!controller.signal.aborted) {
        try {
          // catch up on anything written while disconnected
          scheduleSync();
          await streamWorkspaceChanges(token!, workspaceId!, controller.signal, () => {
            retryDelay = 1000;
            scheduleSync();
          });
        } catch (error) {
          if (controller.signal.aborted) return;
          if (error instanceof ApiError && error.status === 401) return;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay = Math.min(retryDelay * 2, maxRetryDelayMs);
      }
    }

    void connect();
    return () => {
      controller.abort();
      clearTimeout(pending);
    };
  }, [token, workspaceId]);
}
