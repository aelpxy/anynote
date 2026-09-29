import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

import { SidebarAddButton } from "~/components/sidebar-add-button";
import { SidebarCollection } from "~/components/sidebar-collection";
import { SidebarEmptyState } from "~/components/sidebar-empty-state";
import { SidebarLink } from "~/components/sidebar-link";
import { SidebarNoteLink } from "~/components/sidebar-note-link";
import { SidebarSearchButton } from "~/components/sidebar-search-button";
import { SidebarSection } from "~/components/sidebar-section";
import { WorkspaceMenu } from "~/components/workspace-menu";
import { useSidebarDropTargets } from "~/hooks/use-sidebar-drop-targets";
import { clearNoteSelection } from "~/lib/ui/note-selection";
import type { Collection, Note } from "~/lib/vault/types";

type SidebarProps = {
  favorites: Note[];
  documents: Note[];
  collections: Collection[];
  onSearch: () => void;
};

export function Sidebar({
  favorites,
  documents,
  collections,
  onSearch,
}: SidebarProps) {
  const dropTargets = useSidebarDropTargets();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") clearNoteSelection();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <motion.aside
      initial={{ width: 0 }}
      animate={{ width: "14rem" }}
      exit={{ width: 0 }}
      transition={{ duration: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
      className="shrink-0 overflow-hidden print:hidden"
    >
      <div className="h-full w-56 py-2 pl-2">
        <div className="flex h-full flex-col rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="h-12 shrink-0" />
          <div className="flex flex-col gap-3 px-1.5">
            <WorkspaceMenu />
            <SidebarSearchButton onClick={onSearch} />
          </div>
          <nav className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto px-1.5 pb-2">
            <SidebarSection
              title="Favorites"
              isDropTarget={dropTargets.favorites.isOver}
              dropTargetProps={dropTargets.favorites.dropTargetProps}
            >
              {favorites.length === 0 && (
                <SidebarEmptyState message="No favorites" />
              )}
              {favorites.map((note) => (
                <SidebarNoteLink
                  key={note.id}
                  note={note}
                  source="favorites"
                  siblings={favorites}
                />
              ))}
            </SidebarSection>
            <SidebarSection
              title="Documents"
              isDropTarget={dropTargets.documents.isOver}
              dropTargetProps={dropTargets.documents.dropTargetProps}
              action={<SidebarAddButton action="/notes" label="New document" />}
            >
              {documents.length === 0 && (
                <SidebarEmptyState
                  message="No documents"
                  action={{ path: "/notes", label: "New document" }}
                />
              )}
              {documents.map((note) => (
                <SidebarNoteLink
                  key={note.id}
                  note={note}
                  source="documents"
                  siblings={documents}
                />
              ))}
            </SidebarSection>
            <SidebarSection
              title="Collections"
              isDropTarget={dropTargets.collections.isOver}
              dropTargetProps={dropTargets.collections.dropTargetProps}
              action={
                <SidebarAddButton action="/collections" label="New collection" />
              }
            >
              {collections.length === 0 && (
                <SidebarEmptyState
                  message="No collections"
                  action={{ path: "/collections", label: "New collection" }}
                />
              )}
              {collections.map((collection) => (
                <SidebarCollection
                  key={collection.id}
                  collection={collection}
                />
              ))}
            </SidebarSection>
          </nav>
          <div className="border-t border-neutral-200 p-1.5 dark:border-neutral-800">
            <div
              {...dropTargets.trash.dropTargetProps}
              className={[
                "rounded-md transition-colors",
                dropTargets.trash.isOver
                  ? "bg-neutral-200 dark:bg-neutral-800"
                  : "",
              ].join(" ")}
            >
              <SidebarLink to="/trash" icon={Trash2}>
                Trash
              </SidebarLink>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
