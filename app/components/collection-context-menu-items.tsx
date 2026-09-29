import { Folder, FolderInput, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { useRouteLoaderData } from "react-router";

import { MenuItem } from "~/components/menu-item";
import { MenuSeparator } from "~/components/menu-separator";
import { MenuSubmenu } from "~/components/menu-submenu";
import type { CollectionActions } from "~/hooks/use-collection-actions";
import { flattenCollections } from "~/lib/vault/queries";
import type { Collection } from "~/lib/vault/types";
import type { clientLoader } from "~/routes/sidebar-layout";

type CollectionContextMenuItemsProps = {
  collection: Collection;
  actions: CollectionActions;
  onRename: () => void;
  onCreateSubcollection: () => void;
};

export function CollectionContextMenuItems({
  collection,
  actions,
  onRename,
  onCreateSubcollection,
}: CollectionContextMenuItemsProps) {
  const layoutData = useRouteLoaderData<typeof clientLoader>("routes/sidebar-layout");
  const excludedIds = new Set(
    flattenCollections([collection]).map((option) => option.collection.id),
  );
  const moveTargets = flattenCollections(layoutData?.collections ?? []).filter(
    (option) =>
      !excludedIds.has(option.collection.id) &&
      option.collection.id !== collection.parentId,
  );

  return (
    <>
      <MenuItem icon={Pencil} onClick={onRename}>
        Rename
      </MenuItem>
      <MenuItem icon={FolderPlus} onClick={onCreateSubcollection}>
        New subcollection
      </MenuItem>
      <MenuSubmenu icon={FolderInput} label="Move to">
        <MenuItem
          icon={Folder}
          disabled={collection.parentId === null}
          onClick={() => actions.move(null)}
        >
          Top level
        </MenuItem>
        {moveTargets.map(({ collection: target, label }) => (
          <MenuItem
            key={target.id}
            icon={Folder}
            onClick={() => actions.move(target.id)}
          >
            {label}
          </MenuItem>
        ))}
      </MenuSubmenu>
      <MenuSeparator />
      <MenuItem icon={Trash2} onClick={actions.remove}>
        Delete collection
      </MenuItem>
    </>
  );
}
