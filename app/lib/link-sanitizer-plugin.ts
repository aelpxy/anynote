import type { Node } from "@milkdown/kit/prose/model";
import { type EditorState, Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { $prose } from "@milkdown/kit/utils";

import { isSafeHref } from "~/lib/safe-url";

export function removeUnsafeLinks(state: EditorState) {
  const linkType = state.schema.marks.link;
  const tr = state.tr;

  state.doc.descendants((node: Node, pos) => {
    const link = linkType.isInSet(node.marks);
    if (link && !isSafeHref(String(link.attrs.href ?? ""))) {
      tr.removeMark(pos, pos + node.nodeSize, link);
    }
  });

  return tr.docChanged ? tr : null;
}

// links in stored notes and pasted content come from outside the editor, so they're checked on arrival
export const linkSanitizerPlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey("link-sanitizer"),
      view(view) {
        const tr = removeUnsafeLinks(view.state);
        if (tr) view.dispatch(tr);
        return {};
      },
      appendTransaction(transactions, _oldState, newState) {
        const isPasteOrDrop = transactions.some((tr) => {
          const event = tr.getMeta("uiEvent");
          return tr.docChanged && (event === "paste" || event === "drop");
        });
        return isPasteOrDrop ? removeUnsafeLinks(newState) : null;
      },
    }),
);
