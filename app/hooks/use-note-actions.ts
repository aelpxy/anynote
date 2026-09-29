import { useFetcher, useMatch } from "react-router";

import {
  toastAddedToCollection,
  toastRemovedFromCollection,
  toastTrashed,
} from "~/lib/ui/undo-toasts";

export type NoteActions = ReturnType<typeof useNoteActions>;

export function useNoteActions(noteId: string) {
  const fetcher = useFetcher();
  const isActive = useMatch(`/notes/${noteId}`) !== null;

  function submit(intent: string, fields: Record<string, string> = {}) {
    fetcher.submit(
      { intent, ...fields },
      { method: "post", action: `/notes/${noteId}` },
    );
  }

  const pendingTitle =
    fetcher.formData?.get("intent") === "rename"
      ? String(fetcher.formData.get("title"))
      : undefined;

  return {
    pendingTitle,
    isSaving: fetcher.state !== "idle",
    rename: (title: string) => submit("rename", { title }),
    setIcon: (icon: string) => submit("set-icon", { icon }),
    saveContent: (content: string) => submit("update-content", { content }),
    setFavorite: (isFavorite: boolean) =>
      submit(isFavorite ? "favorite" : "unfavorite"),
    duplicate: () => submit("duplicate"),
    addToCollection: (collectionId: string) => {
      submit("add-to-collection", { collectionId });
      toastAddedToCollection([noteId], collectionId);
    },
    removeFromCollection: (collectionId: string) => {
      submit("remove-from-collection", { collectionId });
      toastRemovedFromCollection([noteId], collectionId);
    },
    trash: () => {
      submit("trash", isActive ? { redirect: "home" } : {});
      toastTrashed([noteId]);
    },
  };
}
