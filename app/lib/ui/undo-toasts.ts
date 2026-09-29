import { showToast } from "~/lib/ui/toast-store";

function describeNotes(noteIds: string[]) {
  return noteIds.length === 1 ? "Note" : `${noteIds.length} notes`;
}

function bulkUndo(intent: string, noteIds: string[], fields: Record<string, string> = {}) {
  return {
    action: "/notes/bulk",
    fields: { intent, noteIds: JSON.stringify(noteIds), ...fields },
  };
}

export function toastTrashed(noteIds: string[]) {
  showToast({
    message: `${describeNotes(noteIds)} moved to trash`,
    undo: bulkUndo("restore", noteIds),
  });
}

export function toastRemovedFromCollection(noteIds: string[], collectionId: string) {
  showToast({
    message: `${describeNotes(noteIds)} removed from collection`,
    undo: bulkUndo("add-to-collection", noteIds, { collectionId }),
  });
}

export function toastAddedToCollection(
  noteIds: string[],
  collectionId: string,
  fromCollectionId?: string,
) {
  if (fromCollectionId === collectionId) return;
  showToast(
    fromCollectionId
      ? {
          message: `${describeNotes(noteIds)} moved to collection`,
          undo: bulkUndo("add-to-collection", noteIds, {
            collectionId: fromCollectionId,
            fromCollectionId: collectionId,
          }),
        }
      : {
          message: `${describeNotes(noteIds)} added to collection`,
          undo: bulkUndo("remove-from-collection", noteIds, { collectionId }),
        },
  );
}

export function toastCollectionMoved(collectionId: string, previousParentId: string | null) {
  showToast({
    message: "Collection moved",
    undo: {
      action: `/collections/${collectionId}`,
      fields: { intent: "move", parentId: previousParentId ?? "" },
    },
  });
}
