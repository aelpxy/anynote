import { useEffect } from "react";
import { useNavigate } from "react-router";

import { isPersistedAccountKey } from "~/lib/account/persisted-account";
import { getAccount, setAccount } from "~/lib/account/session-store";

// locking or logging out in one tab locks every open tab
export function useCrossTabLock() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (!isPersistedAccountKey(event.key) || event.newValue !== null || !getAccount()) return;
      setAccount(null);
      navigate("/unlock");
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [navigate]);
}
