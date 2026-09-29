import { useEffect, useRef, useState } from "react";

const openDelayMs = 120;
const closeDelayMs = 250;
const pointerSlackPx = 24;
const rearmDistancePx = 80;

export function useSidebarPeek(isAvailable: boolean) {
  const [isPeeking, setIsPeeking] = useState(false);
  const peekRef = useRef<HTMLDivElement>(null);
  const isArmedRef = useRef(false);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isOpen = isAvailable && isPeeking;

  function close() {
    clearTimeout(openTimeoutRef.current);
    isArmedRef.current = false;
    setIsPeeking(false);
  }

  useEffect(() => {
    if (!isAvailable) return;
    isArmedRef.current = false;

    function rearm(event: PointerEvent) {
      if (event.clientX > rearmDistancePx) isArmedRef.current = true;
    }

    document.addEventListener("pointermove", rearm);
    return () => {
      document.removeEventListener("pointermove", rearm);
      clearTimeout(openTimeoutRef.current);
    };
  }, [isAvailable]);

  useEffect(() => {
    if (!isOpen) return;
    let closeTimeout: ReturnType<typeof setTimeout> | undefined;

    function handlePointerMove(event: PointerEvent) {
      const rect = peekRef.current?.getBoundingClientRect();
      const isNear = rect !== undefined && event.clientX <= rect.right + pointerSlackPx;
      const hasOpenPopup = document.querySelector('[role="menu"], [role="dialog"]') !== null;
      if (isNear || hasOpenPopup) {
        clearTimeout(closeTimeout);
        closeTimeout = undefined;
      } else if (!closeTimeout) {
        closeTimeout = setTimeout(close, closeDelayMs);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(closeTimeout);
      document.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return {
    isPeeking: isOpen,
    peekRef,
    requestPeek: () => {
      if (!isArmedRef.current) return;
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = setTimeout(() => setIsPeeking(true), openDelayMs);
    },
    cancelPeekRequest: () => clearTimeout(openTimeoutRef.current),
    closePeek: close,
  };
}
