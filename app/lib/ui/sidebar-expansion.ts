const storageKey = "anynote:sidebar-expanded";

let expanded: Record<string, boolean> = read();
const listeners = new Set<() => void>();

function read(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return stored && typeof stored === "object" ? (stored as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function isExpanded(id: string, fallback: boolean) {
  return expanded[id] ?? fallback;
}

export function setExpanded(id: string, open: boolean) {
  if (expanded[id] === open) return;
  expanded = { ...expanded, [id]: open };
  localStorage.setItem(storageKey, JSON.stringify(expanded));
  for (const listener of listeners) listener();
}

export function subscribeToExpansion(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
