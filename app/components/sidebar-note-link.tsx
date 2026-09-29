import { FileText } from "lucide-react";
import { useRef, useState } from "react";

import { BulkNoteContextMenuItems } from "~/components/bulk-note-context-menu-items";
import { NoteContextMenuItems } from "~/components/note-context-menu-items";
import { SidebarContextMenu } from "~/components/sidebar-context-menu";
import { SidebarDropIndicator } from "~/components/sidebar-drop-indicator";
import { SidebarLink } from "~/components/sidebar-link";
import { SidebarRenameInput } from "~/components/sidebar-rename-input";
import { useArrangeActions } from "~/hooks/use-arrange-actions";
import { useNoteActions } from "~/hooks/use-note-actions";
import { useNoteSelection } from "~/hooks/use-note-selection";
import { useSidebarDropTarget } from "~/hooks/use-sidebar-drop-target";
import {
  useOpenSidebarNote,
  useSidebarSelection,
} from "~/hooks/use-sidebar-selection";
import {
  clearNoteSelection,
  selectNoteRange,
  toggleNoteSelection,
} from "~/lib/ui/note-selection";
import {
  getRowZone,
  setCountDragImage,
  setSidebarDrag,
} from "~/lib/ui/sidebar-drag";
import type { Note } from "~/lib/vault/types";

type SidebarNoteLinkProps = {
  note: Note;
  source: string;
  siblings: Note[];
  collectionId?: string;
};

export function SidebarNoteLink({
  note,
  source,
  siblings,
  collectionId,
}: SidebarNoteLinkProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const to = `/notes/${note.id}`;
  const selection = useSidebarSelection(to, source);
  const openNote = useOpenSidebarNote();
  const noteSelection = useNoteSelection();
  const actions = useNoteActions(note.id);
  const arrangeActions = useArrangeActions();
  const title = actions.pendingTitle ?? note.title;

  const selectedNotes =
    noteSelection.source === source
      ? siblings.filter(({ id }) => noteSelection.noteIds.includes(id))
      : [];
  const isMultiSelected =
    selectedNotes.length > 1 && selectedNotes.some(({ id }) => id === note.id);
  const openNoteInList =
    openNote.source === source &&
    siblings.some(({ id }) => id === openNote.noteId)
      ? openNote.noteId
      : undefined;

  const { overZone, dropTargetProps } = useSidebarDropTarget({
    claims: (item) => item.kind === "notes",
    getZone: (event) => getRowZone(event, rowRef.current, false),
    canDrop: (item) => item.kind === "notes" && !item.noteIds.includes(note.id),
    onDrop: (item, zone) => {
      if (item.kind !== "notes" || zone === "inside") return;
      const placement = { anchorId: note.id, side: zone };
      if (collectionId) {
        arrangeActions.addToCollection(item.noteIds, collectionId, {
          placement,
          fromCollectionId: item.collectionId,
        });
      } else {
        arrangeActions.placeNotes(item.noteIds, {
          placement,
          fromCollectionId:
            source === "documents" ? item.collectionId : undefined,
          favorite: source === "favorites",
        });
      }
    },
  });

  if (isRenaming) {
    return (
      <SidebarRenameInput
        icon={FileText}
        label="Note title"
        defaultValue={title}
        onSubmit={(value) => {
          actions.rename(value);
          setIsRenaming(false);
        }}
        onCancel={() => setIsRenaming(false)}
      />
    );
  }

  return (
    <div ref={rowRef} className="relative" {...dropTargetProps}>
      <SidebarContextMenu
        label={title}
        menu={
          isMultiSelected ? (
            <BulkNoteContextMenuItems
              notes={selectedNotes}
              collectionId={collectionId}
              actions={arrangeActions}
            />
          ) : (
            <NoteContextMenuItems
              note={note}
              collectionId={collectionId}
              actions={actions}
              onRename={() => setIsRenaming(true)}
            />
          )
        }
      >
        <SidebarLink
          to={to}
          icon={FileText}
          emoji={note.icon}
          state={selection.state}
          isSelected={selection.isSelected}
          isHighlighted={isMultiSelected}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey) {
              event.preventDefault();
              toggleNoteSelection(source, note.id, openNoteInList);
            } else if (event.shiftKey) {
              event.preventDefault();
              selectNoteRange(
                source,
                siblings.map(({ id }) => id),
                note.id,
                openNoteInList,
              );
            } else {
              clearNoteSelection();
            }
          }}
          onDragStart={(event) => {
            const notes = isMultiSelected ? selectedNotes : [note];
            if (isMultiSelected) {
              setCountDragImage(event, `${notes.length} notes`);
            } else {
              clearNoteSelection();
              event.dataTransfer.setDragImage(event.currentTarget, 8, 8);
            }
            setSidebarDrag({
              kind: "notes",
              noteIds: notes.map(({ id }) => id),
              collectionId,
              areAllFavorites: notes.every(({ isFavorite }) => isFavorite),
            });
          }}
          onDragEnd={() => setSidebarDrag(null)}
        >
          {title}
        </SidebarLink>
      </SidebarContextMenu>
      {overZone && overZone !== "inside" && (
        <SidebarDropIndicator side={overZone} />
      )}
    </div>
  );
}
