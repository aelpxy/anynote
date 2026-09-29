import { useState } from "react";

import {
  type DropZone,
  getSidebarDrag,
  setSidebarDrag,
  type SidebarDragItem,
} from "~/lib/ui/sidebar-drag";

// nested targets see the same native event, so the innermost target that claims it wins
const claimedEvents = new WeakSet<Event>();

type SidebarDropTargetOptions = {
  claims: (item: SidebarDragItem) => boolean;
  getZone?: (event: React.DragEvent, item: SidebarDragItem) => DropZone;
  canDrop: (item: SidebarDragItem, zone: DropZone) => boolean;
  onDrop: (item: SidebarDragItem, zone: DropZone) => void;
};

export type SidebarDropTargetProps = ReturnType<
  typeof useSidebarDropTarget
>["dropTargetProps"];

export function useSidebarDropTarget({
  claims,
  getZone = () => "inside",
  canDrop,
  onDrop,
}: SidebarDropTargetOptions) {
  const [overZone, setOverZone] = useState<DropZone | null>(null);

  function resolve(event: React.DragEvent) {
    const item = getSidebarDrag();
    if (!item || claimedEvents.has(event.nativeEvent) || !claims(item)) {
      return null;
    }
    claimedEvents.add(event.nativeEvent);
    const zone = getZone(event, item);
    return canDrop(item, zone) ? { item, zone } : null;
  }

  return {
    isOver: overZone !== null,
    overZone,
    dropTargetProps: {
      onDragOver(event: React.DragEvent) {
        const target = resolve(event);
        setOverZone(target?.zone ?? null);
        if (!target) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },
      onDragLeave(event: React.DragEvent) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOverZone(null);
        }
      },
      onDrop(event: React.DragEvent) {
        const target = resolve(event);
        setOverZone(null);
        if (!target) return;
        event.preventDefault();
        setSidebarDrag(null);
        onDrop(target.item, target.zone);
      },
    },
  };
}
