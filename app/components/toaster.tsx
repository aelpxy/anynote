import { AnimatePresence, motion } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";
import { useFetcher } from "react-router";

import {
  dismissToast,
  getToast,
  subscribeToToast,
} from "~/lib/ui/toast-store";

const toastDurationMs = 5000;

export function Toaster() {
  const toast = useSyncExternalStore(subscribeToToast, getToast, getToast);
  const fetcher = useFetcher();

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => dismissToast(toast.id), toastDurationMs);
    return () => clearTimeout(timeout);
  }, [toast]);

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
            className="pointer-events-auto flex items-center gap-3 rounded-lg bg-neutral-900 py-2 pr-2 pl-3.5 text-sm text-white shadow-lg shadow-neutral-900/20 dark:bg-neutral-100 dark:text-neutral-900"
          >
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  const { action, fields } = toast.undo!;
                  fetcher.submit(fields, { method: "post", action });
                  dismissToast(toast.id);
                }}
                className="rounded-md px-2 py-0.5 font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white dark:text-neutral-600 dark:hover:bg-black/10 dark:hover:text-neutral-900"
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
