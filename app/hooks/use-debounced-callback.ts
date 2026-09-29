import { useEffect, useRef } from "react";

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

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      // flush so edits made right before navigating away are not lost
      if (pendingArgsRef.current) callbackRef.current(...pendingArgsRef.current);
    };
  }, []);

  return (...args: Args) => {
    pendingArgsRef.current = args;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      pendingArgsRef.current = null;
      callbackRef.current(...args);
    }, delay);
  };
}
