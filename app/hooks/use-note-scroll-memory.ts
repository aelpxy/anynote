import { useEffect } from "react";

const settleWindowMs = 2000;

type SavedScroll = {
  top: number;
  tables: number[];
};

function storageKey(noteId: string) {
  return `anynote:scroll:${noteId}`;
}

function readSaved(noteId: string): SavedScroll | null {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey(noteId)) ?? "null");
    if (!saved || typeof saved !== "object") return null;
    const { top, tables } = saved as SavedScroll;
    return typeof top === "number" && Array.isArray(tables) ? { top, tables } : null;
  } catch {
    return null;
  }
}

function tableScrollers(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(".tableWrapper")];
}

export function useNoteScrollMemory(noteId: string, contentRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scroller = document.getElementById("main");
    const content = contentRef.current;
    if (!scroller || !content) return;

    let frame = 0;
    const save = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const saved: SavedScroll = {
          top: scroller.scrollTop,
          tables: tableScrollers(content).map((table) => table.scrollLeft),
        };
        sessionStorage.setItem(storageKey(noteId), JSON.stringify(saved));
      });
    };

    const saved = window.location.hash ? null : readSaved(noteId);
    let isSettling = saved !== null;
    if (!saved && !window.location.hash) scroller.scrollTop = 0;
    const restore = () => {
      if (!saved || !isSettling) return;
      scroller.scrollTop = saved.top;
      tableScrollers(content).forEach((table, index) => {
        table.scrollLeft = saved.tables[index] ?? 0;
      });
    };
    const stopSettling = () => {
      isSettling = false;
    };

    const resizeObserver = new ResizeObserver(restore);
    resizeObserver.observe(content);
    restore();
    const settleTimeout = setTimeout(stopSettling, settleWindowMs);

    const interactions = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    for (const type of interactions) scroller.addEventListener(type, stopSettling, { passive: true });
    scroller.addEventListener("scroll", save, { capture: true, passive: true });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimeout);
      resizeObserver.disconnect();
      for (const type of interactions) scroller.removeEventListener(type, stopSettling);
      scroller.removeEventListener("scroll", save, { capture: true });
    };
  }, [noteId, contentRef]);
}
