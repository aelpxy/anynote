import { useArrangeActions } from "~/hooks/use-arrange-actions";
import { useSidebarDropTarget } from "~/hooks/use-sidebar-drop-target";

export function useSidebarDropTargets() {
  const actions = useArrangeActions();

  const favorites = useSidebarDropTarget({
    claims: (item) => item.kind === "notes",
    canDrop: (item) => item.kind === "notes" && !item.areAllFavorites,
    onDrop: (item) => {
      if (item.kind === "notes") actions.setFavorite(item.noteIds, true);
    },
  });

  const documents = useSidebarDropTarget({
    claims: (item) => item.kind === "notes",
    canDrop: (item) => item.kind === "notes" && item.collectionId !== undefined,
    onDrop: (item) => {
      if (item.kind === "notes" && item.collectionId) {
        actions.removeFromCollection(item.noteIds, item.collectionId);
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
    claims: (item) => item.kind === "notes",
    canDrop: (item) => item.kind === "notes",
    onDrop: (item) => {
      if (item.kind === "notes") actions.trashNotes(item.noteIds);
    },
  });

  return { favorites, documents, collections, trash };
}
