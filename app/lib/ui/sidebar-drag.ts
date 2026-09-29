export type SidebarDragItem =
  | {
      kind: "notes";
      noteIds: string[];
      collectionId?: string;
      areAllFavorites: boolean;
    }
  | {
      kind: "collection";
      collectionId: string;
      parentId: string | null;
      subtreeIds: string[];
    };

export type DropZone = "before" | "inside" | "after";

// dataTransfer can't be read during dragover, so the dragged item lives here instead
let activeItem: SidebarDragItem | null = null;

export function getSidebarDrag() {
  return activeItem;
}

export function setSidebarDrag(item: SidebarDragItem | null) {
  activeItem = item;
}

export function setCountDragImage(event: React.DragEvent, label: string) {
  const image = document.createElement("div");
  image.textContent = label;
  image.className =
    "fixed -top-96 rounded-md bg-neutral-900 px-2 py-1 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900";
  document.body.append(image);
  event.dataTransfer.setDragImage(image, 8, 8);
  // the browser snapshots the image synchronously, so it can go on the next frame
  requestAnimationFrame(() => image.remove());
}

// top and bottom edges reorder; the middle, or anything below the row, drops inside
export function getRowZone(
  event: React.DragEvent,
  row: HTMLElement | null,
  allowInside: boolean,
): DropZone {
  if (!row) return "inside";
  const rect = row.getBoundingClientRect();
  if (event.clientY > rect.bottom) return "inside";
  const ratio = (event.clientY - rect.top) / rect.height;
  if (!allowInside) return ratio < 0.5 ? "before" : "after";
  if (ratio < 0.25) return "before";
  return ratio > 0.75 ? "after" : "inside";
}
