import { useFetcher, useMatch } from "react-router";

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
    rename: (title: string) => submit("rename", { title }),
    saveContent: (content: string) => submit("update-content", { content }),
    setFavorite: (isFavorite: boolean) =>
      submit(isFavorite ? "favorite" : "unfavorite"),
    duplicate: () => submit("duplicate"),
    addToCollection: (collectionId: string) =>
      submit("add-to-collection", { collectionId }),
    removeFromCollection: (collectionId: string) =>
      submit("remove-from-collection", { collectionId }),
    trash: () => submit("trash", isActive ? { redirect: "home" } : {}),
  };
}
