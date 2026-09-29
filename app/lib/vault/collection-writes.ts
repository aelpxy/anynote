let pendingWrites = 0;
let isStale = false;
const settledListeners = new Set<() => void>();

// a sync mid-write would load the old server state over the local one, so reloads wait for writes
export async function trackCollectionWrite<T>(task: () => Promise<T>) {
  pendingWrites += 1;
  try {
    return await task();
  } finally {
    pendingWrites -= 1;
    if (pendingWrites === 0 && isStale) {
      for (const listener of settledListeners) listener();
    }
  }
}

export function hasPendingCollectionWrites() {
  return pendingWrites > 0;
}

export function markCollectionsStale() {
  isStale = true;
}

export function takeCollectionsStale() {
  const wasStale = isStale;
  isStale = false;
  return wasStale;
}

export function subscribeToCollectionWritesSettled(listener: () => void) {
  settledListeners.add(listener);
  return () => {
    settledListeners.delete(listener);
  };
}
