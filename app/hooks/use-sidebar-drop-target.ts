import { useState } from "react";

import {
  getSidebarDrag,
  setSidebarDrag,
  type SidebarDragItem,
} from "~/lib/ui/sidebar-drag";

// nested targets see the same native event, so the innermost target that claims it wins
const claimedEvents = new WeakSet<Event>();

type SidebarDropTargetOptions = {
  claims: (item: SidebarDragItem) => boolean;
  canDrop: (item: SidebarDragItem) => boolean;
  onDrop: (item: SidebarDragItem) => void;
};

export type SidebarDropTargetProps = ReturnType<
  typeof useSidebarDropTarget
>["dropTargetProps"];

export function useSidebarDropTarget({
  claims,
  canDrop,
  onDrop,
}: SidebarDropTargetOptions) {
  const [isOver, setIsOver] = useState(false);

  function resolve(event: React.DragEvent) {
    const item = getSidebarDrag();
    if (!item || claimedEvents.has(event.nativeEvent) || !claims(item)) {
      return null;
    }
    claimedEvents.add(event.nativeEvent);
    return canDrop(item) ? item : null;
  }

  return {
    isOver,
    dropTargetProps: {
      onDragOver(event: React.DragEvent) {
        const item = resolve(event);
        setIsOver(item !== null);
        if (!item) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },
      onDragLeave(event: React.DragEvent) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOver(false);
        }
      },
      onDrop(event: React.DragEvent) {
        const item = resolve(event);
        setIsOver(false);
        if (!item) return;
        event.preventDefault();
        setSidebarDrag(null);
        onDrop(item);
      },
    },
  };
}
