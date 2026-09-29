import { useFetcher } from "react-router";

import { toastCollectionMoved } from "~/lib/ui/undo-toasts";

export type CollectionActions = ReturnType<typeof useCollectionActions>;

export function useCollectionActions(collectionId: string, parentId: string | null) {
  const fetcher = useFetcher();

  function submit(intent: string, fields: Record<string, string> = {}) {
    fetcher.submit(
      { intent, ...fields },
      { method: "post", action: `/collections/${collectionId}` },
    );
  }

  const pendingName =
    fetcher.formData?.get("intent") === "rename"
      ? String(fetcher.formData.get("name"))
      : undefined;

  return {
    pendingName,
    rename: (name: string) => submit("rename", { name }),
    move: (nextParentId: string | null) => {
      submit("move", { parentId: nextParentId ?? "" });
      toastCollectionMoved(collectionId, parentId);
    },
    createSubcollection: () =>
      fetcher.submit(
        { parentId: collectionId },
        { method: "post", action: "/collections" },
      ),
    remove: () => submit("delete"),
  };
}
