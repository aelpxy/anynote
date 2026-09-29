import { AnimatePresence, motion } from "motion/react";
import { useEffect, useEffectEvent, useState, useSyncExternalStore } from "react";
import { useFetcher } from "react-router";

import { isTypingTarget } from "~/lib/ui/shortcuts";
import {
  dismissToast,
  getToast,
  subscribeToToast,
  type Toast,
} from "~/lib/ui/toast-store";

const toastDurationMs = 5000;

export function Toaster() {
  const toast = useSyncExternalStore(subscribeToToast, getToast, getToast);
  const fetcher = useFetcher();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!toast || isPaused) return;
    const timeout = setTimeout(() => dismissToast(toast.id), toastDurationMs);
    return () => clearTimeout(timeout);
  }, [toast, isPaused]);

  function undo(current: Toast) {
    if (!current.undo) return;
    const { action, fields } = current.undo;
    fetcher.submit(fields, { method: "post", action });
    dismissToast(current.id);
    setIsPaused(false);
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const isUndo =
      (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "z";
    if (!isUndo || !toast?.undo || isTypingTarget(event.target)) return;
    event.preventDefault();
    undo(toast);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center print:hidden"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onPointerEnter={() => setIsPaused(true)}
            onPointerLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            className="pointer-events-auto flex items-center gap-3 rounded-lg bg-neutral-900 py-2 pr-2 pl-3.5 text-sm text-white shadow-lg shadow-neutral-900/20 dark:bg-neutral-100 dark:text-neutral-900"
          >
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => undo(toast)}
                className="rounded-md px-2 py-0.5 font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white dark:text-neutral-600 dark:hover:bg-black/10 dark:hover:text-neutral-900 dark:focus-visible:outline-neutral-900"
              >
                Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
