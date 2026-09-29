import { useEffect } from "react";

import { useOpenSidebarNote } from "~/hooks/use-sidebar-selection";
import { setExpanded } from "~/lib/ui/sidebar-expansion";
import type { Collection } from "~/lib/vault/types";

const collectionSourcePrefix = "collection:";

function findParentIds(collections: Collection[], targetId: string, trail: string[] = []): string[] | null {
  for (const collection of collections) {
    if (collection.id === targetId) return [...trail, collection.id];
    const found = findParentIds(collection.children, targetId, [...trail, collection.id]);
    if (found) return found;
  }
  return null;
}

export function useRevealOpenNote(collections: Collection[]) {
  const { noteId, source } = useOpenSidebarNote();

  useEffect(() => {
    if (!noteId || !source.startsWith(collectionSourcePrefix)) return;
    const path = findParentIds(collections, source.slice(collectionSourcePrefix.length)) ?? [];
    for (const id of path) setExpanded(`collection:${id}`, true);
  }, [noteId, source, collections]);
}
