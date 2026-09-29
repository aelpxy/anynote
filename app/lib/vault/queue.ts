import { trackWrite } from "~/lib/vault/connection";

const queues = new Map<string, Promise<unknown>>();
const waiting = new Map<string, Promise<unknown>>();

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
  return trackWrite(next);
}

// joins a write that hasn't started yet; it reads the latest state when it runs, so one send covers both
export function enqueueLatest<T>(key: string, task: () => Promise<T>) {
  const pending = waiting.get(key);
  if (pending) return pending as Promise<T>;

  const next = enqueue(key, () => {
    waiting.delete(key);
    return task();
  });
  waiting.set(key, next);
  return next;
}

export function isPending(key: string) {
  return queues.has(key);
}
