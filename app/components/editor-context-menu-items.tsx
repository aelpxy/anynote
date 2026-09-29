import { editorViewCtx } from "@milkdown/kit/core";
import {
  createCodeBlockCommand,
  insertHrCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from "@milkdown/kit/preset/commonmark";
import { insertTableCommand, toggleStrikethroughCommand } from "@milkdown/kit/preset/gfm";
import { selectAll } from "@milkdown/kit/prose/commands";
import type { EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { type $Command, callCommand } from "@milkdown/kit/utils";
import { useInstance } from "@milkdown/react";
import {
  Bold,
  ClipboardPaste,
  Code,
  Copy,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Scissors,
  SquareCode,
  Strikethrough,
  Table,
  TextSelect,
  Unlink,
  WandSparkles,
} from "lucide-react";

import { MenuItem } from "~/components/menu-item";
import { MenuSeparator } from "~/components/menu-separator";
import { MenuSubmenu } from "~/components/menu-submenu";
import { copySelection, cutSelection, pasteFromClipboard } from "~/lib/editor-clipboard";
import { findLinkAt, findParentNode, type LinkRange } from "~/lib/editor-selection";

type EditorContextMenuItemsProps = {
  view: EditorView;
  state: EditorState;
  onEditLink: (link: LinkRange) => void;
  onOpenLink: (href: string) => void;
  onInsertImage: () => void;
};

export function EditorContextMenuItems({
  view,
  state,
  onEditLink,
  onOpenLink,
  onInsertImage,
}: EditorContextMenuItemsProps) {
  const [, getEditor] = useInstance();
  const { selection } = state;
  const link = findLinkAt(state);
  const hasSelection = !selection.empty;

  function run<T>(command: $Command<T>, payload?: T) {
    getEditor()?.action(callCommand(command.key, payload));
    view.focus();
  }

  function toTaskList() {
    run(wrapInBulletListCommand);
    const editorView = getEditor()?.action((ctx) => ctx.get(editorViewCtx));
    const item = editorView && findParentNode(editorView.state, "list_item");
    if (editorView && item) {
      editorView.dispatch(
        editorView.state.tr.setNodeMarkup(item.pos, undefined, { ...item.node.attrs, checked: false }),
      );
    }
  }

  return (
    <>
      {link && (
        <>
          <MenuItem icon={ExternalLink} onClick={() => onOpenLink(link.href)}>
            Open link
          </MenuItem>
          <MenuItem icon={Copy} onClick={() => void navigator.clipboard.writeText(link.href)}>
            Copy link
          </MenuItem>
          <MenuItem icon={Link} onClick={() => onEditLink(link)}>
            Edit link
          </MenuItem>
          <MenuItem
            icon={Unlink}
            onClick={() =>
              view.dispatch(state.tr.removeMark(link.from, link.to, state.schema.marks.link))
            }
          >
            Remove link
          </MenuItem>
          <MenuSeparator />
        </>
      )}

      <MenuItem icon={Scissors} disabled={!hasSelection} onClick={() => cutSelection(view)}>
        Cut
      </MenuItem>
      <MenuItem icon={Copy} disabled={!hasSelection} onClick={() => copySelection(view)}>
        Copy
      </MenuItem>
      <MenuItem icon={ClipboardPaste} onClick={() => void pasteFromClipboard(view)}>
        Paste
      </MenuItem>

      {hasSelection && (
        <>
          <MenuSeparator />
          <MenuItem icon={Bold} onClick={() => run(toggleStrongCommand)}>
            Bold
          </MenuItem>
          <MenuItem icon={Italic} onClick={() => run(toggleEmphasisCommand)}>
            Italic
          </MenuItem>
          <MenuItem icon={Strikethrough} onClick={() => run(toggleStrikethroughCommand)}>
            Strikethrough
          </MenuItem>
          <MenuItem icon={Code} onClick={() => run(toggleInlineCodeCommand)}>
            Code
          </MenuItem>
          {!link && (
            <MenuItem
              icon={Link}
              onClick={() => onEditLink({ from: selection.from, to: selection.to, href: "" })}
            >
              Link
            </MenuItem>
          )}
        </>
      )}

      <MenuSeparator />
      <MenuSubmenu icon={WandSparkles} label="Turn into">
        <MenuItem icon={Pilcrow} onClick={() => run(turnIntoTextCommand)}>
          Text
        </MenuItem>
        <MenuItem icon={Heading1} onClick={() => run(wrapInHeadingCommand, 1)}>
          Heading 1
        </MenuItem>
        <MenuItem icon={Heading2} onClick={() => run(wrapInHeadingCommand, 2)}>
          Heading 2
        </MenuItem>
        <MenuItem icon={Heading3} onClick={() => run(wrapInHeadingCommand, 3)}>
          Heading 3
        </MenuItem>
        <MenuItem icon={List} onClick={() => run(wrapInBulletListCommand)}>
          Bullet list
        </MenuItem>
        <MenuItem icon={ListOrdered} onClick={() => run(wrapInOrderedListCommand)}>
          Numbered list
        </MenuItem>
        <MenuItem icon={ListChecks} onClick={toTaskList}>
          Task list
        </MenuItem>
        <MenuItem icon={Quote} onClick={() => run(wrapInBlockquoteCommand)}>
          Quote
        </MenuItem>
        <MenuItem icon={SquareCode} onClick={() => run(createCodeBlockCommand)}>
          Code block
        </MenuItem>
      </MenuSubmenu>
      <MenuSubmenu icon={Plus} label="Insert">
        <MenuItem icon={ImagePlus} onClick={onInsertImage}>
          Image
        </MenuItem>
        <MenuItem icon={Table} onClick={() => run(insertTableCommand)}>
          Table
        </MenuItem>
        <MenuItem icon={Minus} onClick={() => run(insertHrCommand)}>
          Divider
        </MenuItem>
      </MenuSubmenu>

      <MenuSeparator />
      <MenuItem
        icon={TextSelect}
        onClick={() => {
          selectAll(view.state, view.dispatch);
          view.focus();
        }}
      >
        Select all
      </MenuItem>
    </>
  );
}
