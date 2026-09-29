import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";

export const placeholderPlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey("placeholder"),
      props: {
        decorations({ doc }) {
          const firstChild = doc.firstChild;
          const isEmpty =
            doc.childCount === 1 &&
            firstChild?.isTextblock &&
            firstChild.content.size === 0;
          if (!firstChild || !isEmpty) return null;

          return DecorationSet.create(doc, [
            Decoration.node(0, firstChild.nodeSize, {
              class: "is-empty",
              "data-placeholder": "Start writing…",
            }),
          ]);
        },
      },
    }),
);
