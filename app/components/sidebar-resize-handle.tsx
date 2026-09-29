import { useRef } from "react";

import {
  defaultSidebarWidth,
  maxSidebarWidth,
  minSidebarWidth,
  setSidebarWidth,
} from "~/lib/ui/layout-store";

const keyboardStep = 16;

type SidebarResizeHandleProps = {
  width: number;
  onResizingChange: (isResizing: boolean) => void;
};

export function SidebarResizeHandle({ width, onResizingChange }: SidebarResizeHandleProps) {
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuenow={width}
      aria-valuemin={minSidebarWidth}
      aria-valuemax={maxSidebarWidth}
      tabIndex={0}
      onKeyDown={(event) => {
        const next = {
          ArrowLeft: width - keyboardStep,
          ArrowRight: width + keyboardStep,
          Home: minSidebarWidth,
          End: maxSidebarWidth,
        }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        setSidebarWidth(next, true);
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { startX: event.clientX, startWidth: width };
        onResizingChange(true);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (drag) setSidebarWidth(drag.startWidth + event.clientX - drag.startX, false);
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        dragRef.current = null;
        setSidebarWidth(drag.startWidth + event.clientX - drag.startX, true);
        onResizingChange(false);
      }}
      onDoubleClick={() => setSidebarWidth(defaultSidebarWidth, true)}
      className="absolute top-2 right-0 bottom-2 z-10 w-2 translate-x-1/2 cursor-col-resize touch-none rounded-full focus-visible:bg-neutral-400 focus-visible:outline-none"
    />
  );
}
