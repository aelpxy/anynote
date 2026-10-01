import { useCallback, useEffect, useRef, useState } from "react";

const showDelay = 400;
const hideDelay = 200;

function getLink(target: EventTarget | null) {
  const link =
    target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]:not(.note-bookmark-link)") : null;
  return link?.classList.contains("heading-anchor") ? null : link;
}

export function useLinkHover(root: HTMLElement) {
  const [link, setLink] = useState<HTMLAnchorElement | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cancelHide = useCallback(() => clearTimeout(hideTimeoutRef.current), []);

  const scheduleHide = useCallback(() => {
    clearTimeout(showTimeoutRef.current);
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setLink(null), hideDelay);
  }, []);

  useEffect(() => {
    function handleMouseOver(event: MouseEvent) {
      const hoveredLink = getLink(event.target);
      if (!hoveredLink) return;

      cancelHide();
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = setTimeout(() => setLink(hoveredLink), showDelay);
    }

    function handleMouseOut(event: MouseEvent) {
      const leftLink = getLink(event.target);
      const isStillInside =
        event.relatedTarget instanceof Node &&
        leftLink?.contains(event.relatedTarget);
      if (leftLink && !isStillInside) scheduleHide();
    }

    function handleKeyDown() {
      clearTimeout(showTimeoutRef.current);
      setLink(null);
    }

    root.addEventListener("mouseover", handleMouseOver);
    root.addEventListener("mouseout", handleMouseOut);
    root.addEventListener("keydown", handleKeyDown);

    return () => {
      root.removeEventListener("mouseover", handleMouseOver);
      root.removeEventListener("mouseout", handleMouseOut);
      root.removeEventListener("keydown", handleKeyDown);
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, [root, cancelHide, scheduleHide]);

  return { link, cancelHide, scheduleHide };
}
