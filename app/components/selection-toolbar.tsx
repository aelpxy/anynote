import { posToDOMRect } from "@milkdown/kit/prose";
import { toggleMark } from "@milkdown/kit/prose/commands";
import type { MarkType } from "@milkdown/kit/prose/model";
import type { EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { Bold, Code, Italic, Link, Strikethrough } from "lucide-react";

import { EditorToolbarButton } from "~/components/editor-toolbar-button";
import { EditorToolbarSeparator } from "~/components/editor-toolbar-separator";
import { FloatingToolbar } from "~/components/floating-toolbar";
import { isMarkActive } from "~/lib/editor-selection";

type SelectionToolbarProps = {
  view: EditorView;
  state: EditorState;
  isLinkActive: boolean;
  onLink: () => void;
};

export function SelectionToolbar({
  view,
  state,
  isLinkActive,
  onLink,
}: SelectionToolbarProps) {
  const { marks } = state.schema;
  const { from, to } = state.selection;
  const reference = {
    getBoundingClientRect: () => posToDOMRect(view, from, to),
    contextElement: view.dom,
  };

  function toggle(type: MarkType) {
    toggleMark(type)(view.state, view.dispatch);
    view.focus();
  }

  return (
    <FloatingToolbar reference={reference} label="Formatting">
      <EditorToolbarButton
        icon={Bold}
        label="Bold"
        isActive={isMarkActive(state, marks.strong)}
        onClick={() => toggle(marks.strong)}
      />
      <EditorToolbarButton
        icon={Italic}
        label="Italic"
        isActive={isMarkActive(state, marks.emphasis)}
        onClick={() => toggle(marks.emphasis)}
      />
      <EditorToolbarButton
        icon={Strikethrough}
        label="Strikethrough"
        isActive={isMarkActive(state, marks.strike_through)}
        onClick={() => toggle(marks.strike_through)}
      />
      <EditorToolbarButton
        icon={Code}
        label="Inline code"
        isActive={isMarkActive(state, marks.inlineCode)}
        onClick={() => toggle(marks.inlineCode)}
      />
      <EditorToolbarSeparator />
      <EditorToolbarButton
        icon={Link}
        label={isLinkActive ? "Edit link" : "Add link"}
        isActive={isLinkActive}
        onClick={onLink}
      />
    </FloatingToolbar>
  );
}
