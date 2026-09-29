import { Folder, FolderMinus, FolderPlus, Star, StarOff, Trash2 } from "lucide-react";
import { useRouteLoaderData } from "react-router";

import { MenuItem } from "~/components/menu-item";
import { MenuSeparator } from "~/components/menu-separator";
import { MenuSubmenu } from "~/components/menu-submenu";
import type { ArrangeActions } from "~/hooks/use-arrange-actions";
import { flattenCollections } from "~/lib/vault/queries";
import type { Note } from "~/lib/vault/types";
import type { clientLoader } from "~/routes/sidebar-layout";

type BulkNoteContextMenuItemsProps = {
  notes: Note[];
  collectionId?: string;
  actions: ArrangeActions;
};

export function BulkNoteContextMenuItems({
  notes,
  collectionId,
  actions,
}: BulkNoteContextMenuItemsProps) {
  const layoutData = useRouteLoaderData<typeof clientLoader>("routes/sidebar-layout");
  const noteIds = notes.map(({ id }) => id);
  const areAllFavorites = notes.every((note) => note.isFavorite);
  const targets = flattenCollections(layoutData?.collections ?? []).filter(
    ({ collection }) =>
      !noteIds.every((noteId) => collection.notes.some(({ id }) => id === noteId)),
  );

  return (
    <>
      <MenuItem
        icon={areAllFavorites ? StarOff : Star}
        onClick={() => actions.setFavorite(noteIds, !areAllFavorites)}
      >
        {areAllFavorites ? "Remove from favorites" : "Add to favorites"}
      </MenuItem>
      <MenuSeparator />
      <MenuSubmenu icon={FolderPlus} label="Add to collection">
        {targets.length === 0 ? (
          <MenuItem icon={Folder} disabled>
            No other collections
          </MenuItem>
        ) : (
          targets.map(({ collection, label }) => (
            <MenuItem
              key={collection.id}
              icon={Folder}
              onClick={() => actions.addToCollection(noteIds, collection.id)}
            >
              {label}
            </MenuItem>
          ))
        )}
      </MenuSubmenu>
      {collectionId && (
        <MenuItem
          icon={FolderMinus}
          onClick={() => actions.removeFromCollection(noteIds, collectionId)}
        >
          Remove from collection
        </MenuItem>
      )}
      <MenuSeparator />
      <MenuItem icon={Trash2} onClick={() => actions.trashNotes(noteIds)}>
        Move {notes.length} to trash
      </MenuItem>
    </>
  );
}
