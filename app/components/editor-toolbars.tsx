import { NodeSelection, TextSelection, type EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";

import { BookmarkPrompt } from "~/components/bookmark-prompt";
import { BookmarkToolbar } from "~/components/bookmark-toolbar";
import { ImageCaptionForm } from "~/components/image-caption-form";
import { ImageToolbar } from "~/components/image-toolbar";
import { LinkForm } from "~/components/link-form";
import { LinkPopover } from "~/components/link-popover";
import { SelectionToolbar } from "~/components/selection-toolbar";
import { TableToolbar } from "~/components/table-toolbar";
import { bookmarkPromptKey } from "~/lib/bookmark";
import {
  findLinkAt,
  findParentNode,
  type LinkRange,
} from "~/lib/editor-selection";

type EditorToolbarsProps = {
  view: EditorView;
  state: EditorState;
  hasFocus: boolean;
  editingLink: LinkRange | null;
  onEditLink: (link: LinkRange | null) => void;
  editingCaptionPos: number | null;
  onEditCaption: (pos: number | null) => void;
  onOpenLink: (href: string) => void;
};

export function EditorToolbars({
  view,
  state,
  hasFocus,
  editingLink,
  onEditLink: setEditingLink,
  editingCaptionPos,
  onEditCaption,
  onOpenLink,
}: EditorToolbarsProps) {
  if (editingCaptionPos !== null) {
    return (
      <ImageCaptionForm view={view} pos={editingCaptionPos} onClose={() => onEditCaption(null)} />
    );
  }

  if (editingLink) {
    return (
      <LinkForm
        view={view}
        link={editingLink}
        onClose={() => setEditingLink(null)}
      />
    );
  }

  if (!hasFocus) return null;

  const { selection } = state;
  const link = findLinkAt(state);
  const table = findParentNode(state, "table");
  const hasTextSelection =
    selection instanceof TextSelection &&
    !selection.empty &&
    !findParentNode(state, "code_block");

  if (selection instanceof NodeSelection && selection.node.type.name === "image") {
    return (
      <ImageToolbar
        view={view}
        pos={selection.from}
        node={selection.node}
        onEditCaption={() => onEditCaption(selection.from)}
      />
    );
  }

  if (selection instanceof NodeSelection && selection.node.type.name === "bookmark") {
    return (
      <BookmarkToolbar view={view} pos={selection.from} node={selection.node} onOpen={onOpenLink} />
    );
  }

  if (hasTextSelection) {
    return (
      <SelectionToolbar
        view={view}
        state={state}
        isLinkActive={Boolean(link)}
        onLink={() =>
          setEditingLink(
            link ?? { from: selection.from, to: selection.to, href: "" },
          )
        }
      />
    );
  }

  const pastedLink = bookmarkPromptKey.getState(state);
  if (pastedLink) {
    return <BookmarkPrompt view={view} link={pastedLink} />;
  }

  if (link) {
    return (
      <LinkPopover
        view={view}
        link={link}
        onOpen={onOpenLink}
        onEdit={() => setEditingLink(link)}
      />
    );
  }

  if (table) {
    return <TableToolbar view={view} state={state} tablePos={table.pos} />;
  }

  return null;
}
