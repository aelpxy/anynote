import { ApiError } from "~/lib/api/client";

// gateway and cloudflare statuses mean the server couldn't be reached, not that the request was wrong
const transientStatuses = new Set([408, 429, 502, 503, 504, 520, 521, 522, 523, 524, 530]);
const firstRetryDelayMs = 1000;
const maxRetryDelayMs = 30_000;

export type ConnectionState = {
  isOffline: boolean;
  pendingWrites: number;
};

let state: ConnectionState = { isOffline: false, pendingWrites: 0 };
const listeners = new Set<() => void>();

function update(changes: Partial<ConnectionState>) {
  const next = { ...state, ...changes };
  if (next.isOffline === state.isOffline && next.pendingWrites === state.pendingWrites) return;
  state = next;
  for (const listener of listeners) listener();
}

export function getConnectionState() {
  return state;
}

export function subscribeToConnection(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function trackWrite<T>(write: Promise<T>) {
  update({ pendingWrites: state.pendingWrites + 1 });
  try {
    return await write;
  } finally {
    update({ pendingWrites: state.pendingWrites - 1 });
  }
}

export function isTransientError(error: unknown) {
  if (error instanceof ApiError) return transientStatuses.has(error.status);
  // fetch rejects with a TypeError when the network is down or the connection drops
  return error instanceof TypeError;
}

function waitBeforeRetry(attempt: number) {
  const delay = Math.min(firstRetryDelayMs * 2 ** attempt, maxRetryDelayMs);
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timeout);
      window.removeEventListener("online", done);
      resolve();
    };
    const timeout = setTimeout(done, delay);
    window.addEventListener("online", done);
  });
}

// keeps retrying until the server answers; only real errors reach the caller
export async function withRetry<T>(request: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const result = await request();
      update({ isOffline: false });
      return result;
    } catch (error) {
      if (!isTransientError(error)) throw error;
      update({ isOffline: true });
      await waitBeforeRetry(attempt);
    }
  }
}

// a retried write may have already landed before its response was lost
export function isStatus(error: unknown, status: number) {
  return error instanceof ApiError && error.status === status;
}
