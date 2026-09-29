import type { Node } from "@milkdown/kit/prose/model";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";

export function slugifyHeading(node: Node) {
  return node.textContent
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export function scrollToHeading(id: string) {
  document.getElementById(id)?.scrollIntoView({ block: "start" });
}

function createAnchor(id: string) {
  const hash = `#${encodeURIComponent(id)}`;
  const anchor = document.createElement("a");
  anchor.href = hash;
  anchor.className = "heading-anchor";
  anchor.contentEditable = "false";
  anchor.textContent = "#";
  anchor.setAttribute("aria-label", "Copy link to heading");

  anchor.addEventListener("mousedown", (event) => event.preventDefault());
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    const url = new URL(window.location.href);
    url.hash = hash;
    window.history.replaceState(window.history.state, "", url);
    void navigator.clipboard.writeText(url.href);
    scrollToHeading(id);
  });

  return anchor;
}

export const headingAnchorPlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey("heading-anchor"),
      props: {
        decorations(state) {
          const decorations: Decoration[] = [];

          state.doc.descendants((node, pos) => {
            const id = node.attrs.id as string | undefined;
            if (node.type.name !== "heading" || !id) return;

            decorations.push(
              Decoration.widget(pos + 1, () => createAnchor(id), {
                side: -1,
                key: `heading-anchor-${id}`,
                ignoreSelection: true,
                stopEvent: () => true,
              }),
            );
          });

          return DecorationSet.create(state.doc, decorations);
        },
      },
    }),
);
