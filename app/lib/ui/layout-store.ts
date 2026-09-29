export const defaultSidebarWidth = 224;
export const minSidebarWidth = 192;
export const maxSidebarWidth = 384;

const sidebarWidthKey = "anynote:sidebar-width";
const sidebarOpenKey = "anynote:sidebar-open";

export type LayoutState = {
  isSidebarOpen: boolean;
  isFocusMode: boolean;
  sidebarWidth: number;
};

function readSidebarWidth() {
  if (typeof window === "undefined") return defaultSidebarWidth;
  const stored = Number(localStorage.getItem(sidebarWidthKey));
  return Number.isFinite(stored) && stored > 0 ? clampSidebarWidth(stored) : defaultSidebarWidth;
}

export function clampSidebarWidth(width: number) {
  return Math.round(Math.min(maxSidebarWidth, Math.max(minSidebarWidth, width)));
}

function readSidebarOpen() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(sidebarOpenKey) !== "false";
}

let state: LayoutState = {
  isSidebarOpen: readSidebarOpen(),
  isFocusMode: false,
  sidebarWidth: readSidebarWidth(),
};
const listeners = new Set<() => void>();

function update(changes: Partial<LayoutState>) {
  state = { ...state, ...changes };
  for (const listener of listeners) listener();
}

export function getLayout() {
  return state;
}

export function subscribeToLayout(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSidebarOpen(isSidebarOpen: boolean, persist = false) {
  update({ isSidebarOpen });
  if (persist) localStorage.setItem(sidebarOpenKey, String(isSidebarOpen));
}

export function toggleSidebar() {
  update({ isFocusMode: false });
  setSidebarOpen(!state.isSidebarOpen, !window.matchMedia("(max-width: 767px)").matches);
}

export function toggleFocusMode() {
  update({ isFocusMode: !state.isFocusMode });
}

export function setSidebarWidth(width: number, persist: boolean) {
  const sidebarWidth = clampSidebarWidth(width);
  update({ sidebarWidth });
  if (persist) localStorage.setItem(sidebarWidthKey, String(sidebarWidth));
}
