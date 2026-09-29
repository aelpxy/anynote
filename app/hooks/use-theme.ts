import { useEffect, useRef, useSyncExternalStore } from "react";

import { applyTheme, getStoredTheme, storeTheme, subscribeToTheme, type Theme } from "~/lib/theme";

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, () => "system" as const);
  return { theme, setTheme: storeTheme };
}

function applyThemeSmoothly(theme: Theme) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || prefersReducedMotion) {
    applyTheme(theme);
    return;
  }
  document.startViewTransition(() => applyTheme(theme));
}

export function useApplyTheme(theme: Theme) {
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      applyTheme(theme);
    } else {
      applyThemeSmoothly(theme);
    }
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyThemeSmoothly(theme);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);
}
