import { useFetcher } from "react-router";

export type CollectionActions = ReturnType<typeof useCollectionActions>;

export function useCollectionActions(collectionId: string) {
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
    move: (parentId: string | null) =>
      submit("move", { parentId: parentId ?? "" }),
    createSubcollection: () =>
      fetcher.submit(
        { parentId: collectionId },
        { method: "post", action: "/collections" },
      ),
    remove: () => submit("delete"),
  };
}
