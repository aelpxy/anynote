import { type RefObject, useEffect } from "react";

function hasFiles(event: DragEvent) {
  return event.dataTransfer?.types.includes("Files") ?? false;
}

// files dropped anywhere on the page go into the editor instead of making the browser open them
export function usePageFileDrop(editorRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    function handleDragOver(event: DragEvent) {
      if (hasFiles(event)) event.preventDefault();
    }

    function handleDrop(event: DragEvent) {
      if (!hasFiles(event)) return;
      const editor = editorRef.current?.querySelector<HTMLElement>(".ProseMirror");
      if (!editor || (event.target instanceof Node && editor.contains(event.target))) return;

      event.preventDefault();
      const last = editor.lastElementChild ?? editor;
      const rect = last.getBoundingClientRect();
      editor.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: event.dataTransfer,
          clientX: rect.right - 1,
          clientY: rect.bottom - 1,
        }),
      );
    }

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [editorRef]);
}
