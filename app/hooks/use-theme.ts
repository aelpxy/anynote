import { useEffect, useSyncExternalStore } from "react";

import { applyTheme, getStoredTheme, storeTheme, subscribeToTheme, type Theme } from "~/lib/theme";

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, () => "system" as const);
  return { theme, setTheme: storeTheme };
}

export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme(theme);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);
}
