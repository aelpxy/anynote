import type { Node } from "@milkdown/kit/prose/model";
import type { EditorView } from "@milkdown/kit/prose/view";
import { Copy, ExternalLink, Link, RefreshCw } from "lucide-react";
import { useState } from "react";

import { EditorToolbarButton } from "~/components/editor-toolbar-button";
import { EditorToolbarSeparator } from "~/components/editor-toolbar-separator";
import { FloatingToolbar } from "~/components/floating-toolbar";
import { refreshBookmark, showAsLink } from "~/lib/bookmark";

type BookmarkToolbarProps = {
  view: EditorView;
  pos: number;
  node: Node;
  onOpen: (href: string) => void;
};

export function BookmarkToolbar({ view, pos, node, onOpen }: BookmarkToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const wrapper = view.nodeDOM(pos);
  if (!(wrapper instanceof Element)) return null;

  const href = String(node.attrs.href);

  async function refresh() {
    setIsRefreshing(true);
    await refreshBookmark(view, href);
    setIsRefreshing(false);
  }

  return (
    <FloatingToolbar reference={wrapper} label="Bookmark" placement="top">
      <EditorToolbarButton icon={ExternalLink} label="Open link" onClick={() => onOpen(href)} />
      <EditorToolbarButton
        icon={Copy}
        label="Copy link"
        onClick={() => void navigator.clipboard.writeText(href)}
      />
      <EditorToolbarButton
        icon={RefreshCw}
        label="Refresh preview"
        disabled={isRefreshing}
        onClick={() => void refresh()}
      />
      <EditorToolbarSeparator />
      <EditorToolbarButton icon={Link} label="Show as link" onClick={() => showAsLink(view, pos, node)} />
    </FloatingToolbar>
  );
}
