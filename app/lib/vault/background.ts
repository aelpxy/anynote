const failureListeners = new Set<(error: unknown) => void>();

// local state is already updated, so a failed save only needs reporting and a reload
export function runInBackground(task: Promise<unknown>) {
  task.catch((error: unknown) => {
    console.error("Background save failed", error);
    for (const listener of failureListeners) listener(error);
  });
}

export function subscribeToBackgroundFailures(listener: (error: unknown) => void) {
  failureListeners.add(listener);
  return () => {
    failureListeners.delete(listener);
  };
}
