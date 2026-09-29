import {
  ArrowDown,
  ArrowUp,
  Copy,
  Folder,
  FolderMinus,
  FolderPlus,
  Link,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { useRouteLoaderData } from "react-router";

import { MenuItem } from "~/components/menu-item";
import { MenuSeparator } from "~/components/menu-separator";
import { MenuSubmenu } from "~/components/menu-submenu";
import type { NoteActions } from "~/hooks/use-note-actions";
import { flattenCollections } from "~/lib/vault/queries";
import type { Note } from "~/lib/vault/types";
import type { clientLoader } from "~/routes/sidebar-layout";

type NoteContextMenuItemsProps = {
  note: Note;
  collectionId?: string;
  actions: NoteActions;
  onRename: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export function NoteContextMenuItems({
  note,
  collectionId,
  actions,
  onRename,
  onMoveUp,
  onMoveDown,
}: NoteContextMenuItemsProps) {
  const layoutData = useRouteLoaderData<typeof clientLoader>("routes/sidebar-layout");
  const otherCollections = flattenCollections(
    layoutData?.collections ?? [],
  ).filter(
    ({ collection }) => !collection.notes.some(({ id }) => id === note.id),
  );

  function copyLink() {
    const url = new URL(`/notes/${note.id}`, window.location.origin);
    void navigator.clipboard.writeText(url.href);
  }

  return (
    <>
      <MenuItem
        icon={note.isFavorite ? StarOff : Star}
        onClick={() => actions.setFavorite(!note.isFavorite)}
      >
        {note.isFavorite ? "Remove from favorites" : "Add to favorites"}
      </MenuItem>
      <MenuItem icon={Pencil} onClick={onRename}>
        Rename
      </MenuItem>
      <MenuItem icon={Copy} onClick={actions.duplicate}>
        Duplicate
      </MenuItem>
      <MenuItem icon={Link} onClick={copyLink}>
        Copy link
      </MenuItem>
      {(onMoveUp || onMoveDown) && (
        <>
          <MenuItem icon={ArrowUp} disabled={!onMoveUp} onClick={onMoveUp}>
            Move up
          </MenuItem>
          <MenuItem icon={ArrowDown} disabled={!onMoveDown} onClick={onMoveDown}>
            Move down
          </MenuItem>
        </>
      )}
      <MenuSeparator />
      <MenuSubmenu icon={FolderPlus} label="Add to collection">
        {otherCollections.length === 0 ? (
          <MenuItem icon={Folder} disabled>
            No other collections
          </MenuItem>
        ) : (
          otherCollections.map(({ collection, label }) => (
            <MenuItem
              key={collection.id}
              icon={Folder}
              onClick={() => actions.addToCollection(collection.id)}
            >
              {label}
            </MenuItem>
          ))
        )}
      </MenuSubmenu>
      {collectionId && (
        <MenuItem
          icon={FolderMinus}
          onClick={() => actions.removeFromCollection(collectionId)}
        >
          Remove from collection
        </MenuItem>
      )}
      <MenuSeparator />
      <MenuItem icon={Trash2} onClick={actions.trash}>
        Move to trash
      </MenuItem>
    </>
  );
}
