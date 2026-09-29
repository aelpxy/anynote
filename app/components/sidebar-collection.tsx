import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight, Folder, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import { CollectionContextMenuItems } from "~/components/collection-context-menu-items";
import { SidebarContextMenu } from "~/components/sidebar-context-menu";
import { SidebarDropIndicator } from "~/components/sidebar-drop-indicator";
import { SidebarNoteLink } from "~/components/sidebar-note-link";
import { SidebarRenameInput } from "~/components/sidebar-rename-input";
import { useArrangeActions } from "~/hooks/use-arrange-actions";
import { useCollectionActions } from "~/hooks/use-collection-actions";
import { useExpanded } from "~/hooks/use-expanded";
import { useSidebarDropTarget } from "~/hooks/use-sidebar-drop-target";
import { getRowZone, setSidebarDrag } from "~/lib/ui/sidebar-drag";
import { countCollectionNotes, flattenCollections } from "~/lib/vault/queries";
import type { Collection } from "~/lib/vault/types";

const expandDelayMs = 500;

type SidebarCollectionProps = {
  collection: Collection;
  siblings: Collection[];
};

export function SidebarCollection({ collection, siblings }: SidebarCollectionProps) {
  const [isOpen, setIsOpen] = useExpanded(`collection:${collection.id}`, false);
  const [isRenaming, setIsRenaming] = useState(false);
  const actions = useCollectionActions(collection.id, collection.parentId);
  const arrangeActions = useArrangeActions();
  const createFetcher = useFetcher();
  const rowRef = useRef<HTMLDivElement>(null);
  const name = actions.pendingName ?? collection.name;
  const noteCount = countCollectionNotes(collection);
  const index = siblings.findIndex(({ id }) => id === collection.id);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];

  const { overZone, dropTargetProps } = useSidebarDropTarget({
    claims: () => true,
    getZone: (event, item) => {
      if (item.kind === "notes") return "inside";
      const zone = getRowZone(event, rowRef.current, true);
      // below an open collection's row come its children, so that edge means inside
      return zone === "after" && isOpen ? "inside" : zone;
    },
    canDrop: (item, zone) => {
      if (item.kind === "notes") {
        return (
          item.collectionId !== collection.id &&
          !item.noteIds.every((noteId) =>
            collection.notes.some(({ id }) => id === noteId),
          )
        );
      }
      if (item.subtreeIds.includes(collection.id)) return false;
      return zone !== "inside" || item.parentId !== collection.id;
    },
    onDrop: (item, zone) => {
      if (item.kind === "notes") {
        arrangeActions.addToCollection(item.noteIds, collection.id, {
          fromCollectionId: item.collectionId,
        });
      } else if (zone === "inside") {
        arrangeActions.moveCollection(
          item.collectionId,
          collection.id,
          item.parentId,
        );
      } else {
        arrangeActions.placeCollection(item.collectionId, {
          anchorId: collection.id,
          side: zone,
        });
        return;
      }
      setIsOpen(true);
    },
  });
  const isOverInside = overZone === "inside";

  useEffect(() => {
    if (!isOverInside || isOpen) return;
    const timeout = setTimeout(() => setIsOpen(true), expandDelayMs);
    return () => clearTimeout(timeout);
  }, [isOverInside, isOpen]);

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      render={<motion.div layout="position" transition={{ duration: 0.15, ease: "easeOut" }} />}
      {...dropTargetProps}
    >
      <div ref={rowRef} className="relative">
        {isRenaming ? (
          <SidebarRenameInput
            icon={Folder}
            label="Collection name"
            defaultValue={name}
            onSubmit={(value) => {
              actions.rename(value);
              setIsRenaming(false);
            }}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <SidebarContextMenu
            label={name}
            buttonPosition="before-chevron"
            extraAction={
              <button
                type="button"
                aria-label={`New note in ${name}`}
                onClick={() => {
                  setIsOpen(true);
                  createFetcher.submit(
                    { collectionId: collection.id },
                    { method: "post", action: "/notes" },
                  );
                }}
                className="absolute top-1/2 right-12 flex size-6 -translate-y-1/2 items-center justify-center rounded text-neutral-600 opacity-0 transition-[opacity,background-color] group-hover/row:opacity-100 hover:bg-neutral-300/70 hover:text-neutral-900 focus-visible:opacity-100 pointer-coarse:opacity-100 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
              >
                <Plus className="size-4" />
              </button>
            }
            menu={
              <CollectionContextMenuItems
                collection={collection}
                actions={actions}
                onRename={() => setIsRenaming(true)}
                onCreateSubcollection={() => {
                  actions.createSubcollection();
                  setIsOpen(true);
                }}
                onMoveUp={
                  previous &&
                  (() =>
                    arrangeActions.placeCollection(collection.id, {
                      anchorId: previous.id,
                      side: "before",
                    }))
                }
                onMoveDown={
                  next &&
                  (() =>
                    arrangeActions.placeCollection(collection.id, {
                      anchorId: next.id,
                      side: "after",
                    }))
                }
              />
            }
          >
            <Collapsible.Trigger
              draggable
              onDragStart={(event) => {
                // firefox only starts a drag when some data is set
                event.dataTransfer.setData("application/x-anynote-collection", collection.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setDragImage(event.currentTarget, 8, 8);
                setSidebarDrag({
                  kind: "collection",
                  collectionId: collection.id,
                  parentId: collection.parentId,
                  subtreeIds: flattenCollections([collection]).map(
                    (option) => option.collection.id,
                  ),
                });
              }}
              onDragEnd={() => setSidebarDrag(null)}
              onKeyDown={(event) => {
                if (event.key !== "F2") return;
                event.preventDefault();
                setIsRenaming(true);
              }}
              className={[
                "group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-[color,background-color,scale] duration-150 active:scale-[0.985] motion-reduce:active:scale-100 pointer-coarse:py-2",
                isOverInside
                  ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-700 hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100",
              ].join(" ")}
            >
              <Folder className="size-4 shrink-0" />
              <span className="flex-1 truncate text-left group-hover/row:pr-12 pointer-coarse:pr-12">
                {name}
              </span>
              {noteCount > 0 && (
                <span className="relative inline-flex overflow-hidden text-xs text-neutral-500 tabular-nums group-hover/row:invisible pointer-coarse:invisible dark:text-neutral-400">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={noteCount}
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 8, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      {noteCount}
                    </motion.span>
                  </AnimatePresence>
                </span>
              )}
              <ChevronRight className="size-3.5 shrink-0 transition-[rotate] duration-150 ease-out group-data-panel-open:rotate-90 motion-reduce:transition-none" />
            </Collapsible.Trigger>
          </SidebarContextMenu>
        )}
        {overZone && overZone !== "inside" && (
          <SidebarDropIndicator side={overZone} />
        )}
      </div>
      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out motion-reduce:transition-none data-ending-style:h-0 data-starting-style:h-0">
        <div className="flex flex-col gap-0.5 pt-0.5 pl-4">
          {collection.children.map((child) => (
            <SidebarCollection
              key={child.id}
              collection={child}
              siblings={collection.children}
            />
          ))}
          {collection.notes.map((note) => (
            <SidebarNoteLink
              key={note.id}
              note={note}
              source={`collection:${collection.id}`}
              siblings={collection.notes}
              collectionId={collection.id}
            />
          ))}
          {collection.children.length === 0 &&
            collection.notes.length === 0 && (
              <p className="px-1.5 py-1 text-sm text-neutral-600 dark:text-neutral-400">
                Empty
              </p>
            )}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
