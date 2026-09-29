export const themes = ["light", "dark", "system"] as const;

export type Theme = (typeof themes)[number];

const storageKey = "anynote:theme";
const listeners = new Set<() => void>();

export function isTheme(value: unknown): value is Theme {
  return themes.includes(value as Theme);
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(storageKey);
  return isTheme(stored) ? stored : "system";
}

export function storeTheme(theme: Theme) {
  localStorage.setItem(storageKey, theme);
  for (const listener of listeners) listener();
}

export function subscribeToTheme(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

// self-contained so it can also be inlined as a blocking script before first paint
export function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export function getThemeScript() {
  return `(${applyTheme.toString()})(localStorage.getItem(${JSON.stringify(storageKey)}) || "system")`;
}
