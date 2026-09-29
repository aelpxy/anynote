import { posToDOMRect } from "@milkdown/kit/prose";
import type { EditorView } from "@milkdown/kit/prose/view";
import { Copy, ExternalLink, Pencil, Unlink } from "lucide-react";

import { EditorToolbarButton } from "~/components/editor-toolbar-button";
import { EditorToolbarSeparator } from "~/components/editor-toolbar-separator";
import { FloatingToolbar } from "~/components/floating-toolbar";
import type { LinkRange } from "~/lib/editor-selection";

type LinkPopoverProps = {
  view: EditorView;
  link: LinkRange;
  onOpen: (href: string) => void;
  onEdit: () => void;
};

export function LinkPopover({ view, link, onOpen, onEdit }: LinkPopoverProps) {
  const reference = {
    getBoundingClientRect: () => posToDOMRect(view, link.from, link.to),
    contextElement: view.dom,
  };

  function removeLink() {
    view.dispatch(
      view.state.tr.removeMark(link.from, link.to, view.state.schema.marks.link),
    );
    view.focus();
  }

  return (
    <FloatingToolbar reference={reference} label="Link" placement="bottom">
      <span
        title={link.href}
        className="max-w-64 truncate px-1.5 text-sm text-neutral-700 dark:text-neutral-300"
      >
        {link.href}
      </span>
      <EditorToolbarSeparator />
      <EditorToolbarButton
        icon={ExternalLink}
        label="Open link"
        onClick={() => onOpen(link.href)}
      />
      <EditorToolbarButton
        icon={Copy}
        label="Copy link"
        onClick={() => void navigator.clipboard.writeText(link.href)}
      />
      <EditorToolbarButton icon={Pencil} label="Edit link" onClick={onEdit} />
      <EditorToolbarButton icon={Unlink} label="Remove link" onClick={removeLink} />
    </FloatingToolbar>
  );
}
