export type AppDialog = "account" | "settings" | "create-workspace" | "shortcuts";

let openDialog: AppDialog | null = null;
const listeners = new Set<() => void>();

export function getOpenDialog() {
  return openDialog;
}

export function setOpenDialog(next: AppDialog | null) {
  openDialog = next;
  for (const listener of listeners) listener();
}

export function subscribeToDialog(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
