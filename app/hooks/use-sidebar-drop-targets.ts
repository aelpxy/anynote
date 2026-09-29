import { useSidebarDropActions } from "~/hooks/use-sidebar-drop-actions";
import { useSidebarDropTarget } from "~/hooks/use-sidebar-drop-target";

export function useSidebarDropTargets() {
  const actions = useSidebarDropActions();

  const favorites = useSidebarDropTarget({
    claims: (item) => item.kind === "note",
    canDrop: (item) => item.kind === "note" && !item.isFavorite,
    onDrop: (item) => {
      if (item.kind === "note") actions.favoriteNote(item.noteId);
    },
  });

  const documents = useSidebarDropTarget({
    claims: (item) => item.kind === "note",
    canDrop: (item) => item.kind === "note" && item.collectionId !== undefined,
    onDrop: (item) => {
      if (item.kind === "note" && item.collectionId) {
        actions.removeNoteFromCollection(item.noteId, item.collectionId);
      }
    },
  });

  const collections = useSidebarDropTarget({
    claims: (item) => item.kind === "collection",
    canDrop: (item) => item.kind === "collection" && item.parentId !== null,
    onDrop: (item) => {
      if (item.kind === "collection") actions.moveCollection(item.collectionId, null);
    },
  });

  const trash = useSidebarDropTarget({
    claims: (item) => item.kind === "note",
    canDrop: (item) => item.kind === "note",
    onDrop: (item) => {
      if (item.kind === "note") actions.trashNote(item.noteId);
    },
  });

  return { favorites, documents, collections, trash };
}
