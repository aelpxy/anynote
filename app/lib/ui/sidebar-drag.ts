export type SidebarDragItem =
  | { kind: "note"; noteId: string; collectionId?: string; isFavorite: boolean }
  | {
      kind: "collection";
      collectionId: string;
      parentId: string | null;
      subtreeIds: string[];
    };

// dataTransfer can't be read during dragover, so the dragged item lives here instead
let activeItem: SidebarDragItem | null = null;

export function getSidebarDrag() {
  return activeItem;
}

export function setSidebarDrag(item: SidebarDragItem | null) {
  activeItem = item;
}
