import type { Node } from "@milkdown/kit/prose/model";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";

function findListItem(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos);

  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === "list_item") return { node, pos: $pos.before(depth) };
  }
}

function setChecked(view: EditorView, pos: number, node: Node, checked: boolean) {
  view.dispatch(
    view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, checked }),
  );
}

export const taskListPlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey("task-list"),
      props: {
        handleDOMEvents: {
          mousedown(view, event) {
            const target = event.target;
            if (
              !(target instanceof HTMLElement) ||
              !target.matches('li[data-item-type="task"]')
            ) {
              return false;
            }

            // the checkbox is a ::before drawn in the gutter left of the item's content
            if (event.clientX >= target.getBoundingClientRect().left) {
              return false;
            }

            const item = findListItem(view, view.posAtDOM(target, 0));
            if (!item) return false;

            event.preventDefault();
            setChecked(view, item.pos, item.node, !item.node.attrs.checked);
            return true;
          },
        },
        handleKeyDown(view, event) {
          if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) {
            return false;
          }

          const item = findListItem(view, view.state.selection.from);
          if (!item) return false;

          const checked = item.node.attrs.checked as boolean | null;
          setChecked(view, item.pos, item.node, checked === null ? false : !checked);
          return true;
        },
      },
    }),
);
