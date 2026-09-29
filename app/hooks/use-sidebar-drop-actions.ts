import { useFetcher, useLocation } from "react-router";

export function useSidebarDropActions() {
  const fetcher = useFetcher();
  const { pathname } = useLocation();

  function submit(action: string, fields: Record<string, string>) {
    fetcher.submit(fields, { method: "post", action });
  }

  return {
    addNoteToCollection: (
      noteId: string,
      collectionId: string,
      fromCollectionId?: string,
    ) =>
      submit(`/notes/${noteId}`, {
        intent: "add-to-collection",
        collectionId,
        ...(fromCollectionId ? { fromCollectionId } : {}),
      }),
    removeNoteFromCollection: (noteId: string, collectionId: string) =>
      submit(`/notes/${noteId}`, {
        intent: "remove-from-collection",
        collectionId,
      }),
    favoriteNote: (noteId: string) =>
      submit(`/notes/${noteId}`, { intent: "favorite" }),
    trashNote: (noteId: string) =>
      submit(`/notes/${noteId}`, {
        intent: "trash",
        ...(pathname === `/notes/${noteId}` ? { redirect: "home" } : {}),
      }),
    moveCollection: (collectionId: string, parentId: string | null) =>
      submit(`/collections/${collectionId}`, {
        intent: "move",
        parentId: parentId ?? "",
      }),
  };
}
