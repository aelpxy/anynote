export type ToastUndo = {
  action: string;
  fields: Record<string, string>;
};

export type Toast = {
  id: number;
  message: string;
  undo?: ToastUndo;
};

let toast: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function getToast() {
  return toast;
}

// one toast at a time; a newer one replaces the last
export function showToast(next: Omit<Toast, "id">) {
  toast = { ...next, id: nextId++ };
  notify();
}

export function dismissToast(id: number) {
  if (toast?.id !== id) return;
  toast = null;
  notify();
}

export function subscribeToToast(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
