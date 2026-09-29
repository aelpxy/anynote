import { useFetcher, useMatch } from "react-router";

import { clearNoteSelection } from "~/lib/ui/note-selection";
import {
  toastAddedToCollection,
  toastCollectionMoved,
  toastRemovedFromCollection,
  toastTrashed,
} from "~/lib/ui/undo-toasts";
import { placementFields } from "~/lib/vault/placement";
import type { Placement } from "~/lib/vault/types";

type PlaceNotesOptions = {
  placement?: Placement;
  fromCollectionId?: string;
  favorite?: boolean;
};

export type ArrangeActions = ReturnType<typeof useArrangeActions>;

export function useArrangeActions() {
  const fetcher = useFetcher();
  const openNoteId = useMatch("/notes/:noteId")?.params.noteId;

  function submitNotes(intent: string, noteIds: string[], fields: Record<string, string> = {}) {
    clearNoteSelection();
    fetcher.submit(
      { intent, noteIds: JSON.stringify(noteIds), ...fields },
      { method: "post", action: "/notes/bulk" },
    );
  }

  return {
    setFavorite: (noteIds: string[], isFavorite: boolean) =>
      submitNotes(isFavorite ? "favorite" : "unfavorite", noteIds),
    trashNotes: (noteIds: string[]) => {
      submitNotes(
        "trash",
        noteIds,
        openNoteId && noteIds.includes(openNoteId) ? { redirect: "home" } : {},
      );
      toastTrashed(noteIds);
    },
    addToCollection: (
      noteIds: string[],
      collectionId: string,
      { placement, fromCollectionId }: PlaceNotesOptions = {},
    ) => {
      submitNotes("add-to-collection", noteIds, {
        collectionId,
        ...(fromCollectionId ? { fromCollectionId } : {}),
        ...placementFields(placement),
      });
      toastAddedToCollection(noteIds, collectionId, fromCollectionId);
    },
    removeFromCollection: (noteIds: string[], collectionId: string) => {
      submitNotes("remove-from-collection", noteIds, { collectionId });
      toastRemovedFromCollection(noteIds, collectionId);
    },
    placeNotes: (
      noteIds: string[],
      { placement, fromCollectionId, favorite }: PlaceNotesOptions,
    ) => {
      submitNotes("place", noteIds, {
        ...(fromCollectionId ? { fromCollectionId } : {}),
        ...(favorite ? { favorite: "true" } : {}),
        ...placementFields(placement),
      });
      if (fromCollectionId) toastRemovedFromCollection(noteIds, fromCollectionId);
    },
    moveCollection: (
      collectionId: string,
      parentId: string | null,
      previousParentId: string | null,
    ) => {
      fetcher.submit(
        { intent: "move", parentId: parentId ?? "" },
        { method: "post", action: `/collections/${collectionId}` },
      );
      toastCollectionMoved(collectionId, previousParentId);
    },
    placeCollection: (collectionId: string, placement: Placement) =>
      fetcher.submit(
        { intent: "move", ...placementFields(placement) },
        { method: "post", action: `/collections/${collectionId}` },
      ),
  };
}
