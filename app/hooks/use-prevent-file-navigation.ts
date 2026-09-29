import { useEffect } from "react";

// the browser's default for a dropped file is to open it and leave the app
export function usePreventFileNavigation() {
  useEffect(() => {
    function preventFileDrop(event: DragEvent) {
      if (event.dataTransfer?.types.includes("Files") && !event.defaultPrevented) {
        event.preventDefault();
      }
    }

    window.addEventListener("dragover", preventFileDrop);
    window.addEventListener("drop", preventFileDrop);
    return () => {
      window.removeEventListener("dragover", preventFileDrop);
      window.removeEventListener("drop", preventFileDrop);
    };
  }, []);
}
