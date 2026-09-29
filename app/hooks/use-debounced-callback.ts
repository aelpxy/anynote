import { useCallback, useEffect, useMemo, useRef } from "react";

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingArgsRef = useRef<Args | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  const flush = useCallback(() => {
    clearTimeout(timeoutRef.current);
    const args = pendingArgsRef.current;
    pendingArgsRef.current = null;
    if (args) callbackRef.current(...args);
  }, []);

  // flush so edits made right before navigating away are not lost
  useEffect(() => flush, [flush]);

  return useMemo(() => {
    const schedule = (...args: Args) => {
      pendingArgsRef.current = args;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(flush, delay);
    };
    return Object.assign(schedule, { flush });
  }, [delay, flush]);
}
