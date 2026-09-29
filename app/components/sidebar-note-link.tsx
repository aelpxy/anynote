import { FileText } from "lucide-react";
import { useState } from "react";

import { NoteContextMenuItems } from "~/components/note-context-menu-items";
import { SidebarContextMenu } from "~/components/sidebar-context-menu";
import { SidebarLink } from "~/components/sidebar-link";
import { SidebarRenameInput } from "~/components/sidebar-rename-input";
import { useNoteActions } from "~/hooks/use-note-actions";
import { useSidebarSelection } from "~/hooks/use-sidebar-selection";
import type { Note } from "~/lib/vault/types";

type SidebarNoteLinkProps = {
  note: Note;
  source: string;
  collectionId?: string;
};

export function SidebarNoteLink({
  note,
  source,
  collectionId,
}: SidebarNoteLinkProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const to = `/notes/${note.id}`;
  const selection = useSidebarSelection(to, source);
  const actions = useNoteActions(note.id);
  const title = actions.pendingTitle ?? note.title;

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
    <SidebarContextMenu
      menu={
        <NoteContextMenuItems
          note={note}
          collectionId={collectionId}
          actions={actions}
          onRename={() => setIsRenaming(true)}
        />
      }
    >
      <SidebarLink
        to={to}
        icon={FileText}
        state={selection.state}
        isSelected={selection.isSelected}
      >
        {title}
      </SidebarLink>
    </SidebarContextMenu>
  );
}
