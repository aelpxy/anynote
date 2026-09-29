const queues = new Map<string, Promise<unknown>>();

// runs writes for the same item one after another so versions never race
export function enqueue<T>(key: string, task: () => Promise<T>) {
  const previous = queues.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  queues.set(key, next);
  void next
    .finally(() => {
      if (queues.get(key) === next) queues.delete(key);
    })
    .catch(() => undefined);
  return next;
}

export function isPending(key: string) {
  return queues.has(key);
}
