import type { MarkType } from "@milkdown/kit/prose/model";
import type { EditorState } from "@milkdown/kit/prose/state";

export type LinkRange = {
  from: number;
  to: number;
  href: string;
};

export function isMarkActive(state: EditorState, type: MarkType) {
  const { from, to, empty, $from } = state.selection;
  if (empty) return Boolean(type.isInSet(state.storedMarks ?? $from.marks()));
  return state.doc.rangeHasMark(from, to, type);
}

export function findParentNode(state: EditorState, name: string) {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === name) return { node, pos: $from.before(depth) };
  }
}

function getLinkRanges(state: EditorState) {
  const { $from } = state.selection;
  const linkType = state.schema.marks.link;
  const parentStart = $from.start();
  const ranges: LinkRange[] = [];

  $from.parent.forEach((child, offset) => {
    const href = linkType.isInSet(child.marks)?.attrs.href as string | undefined;
    if (!href) return;

    const from = parentStart + offset;
    const to = from + child.nodeSize;
    const last = ranges.at(-1);

    if (last && last.to === from && last.href === href) {
      last.to = to;
    } else {
      ranges.push({ from, to, href });
    }
  });

  return ranges;
}

export function findLinkAt(state: EditorState) {
  const { from, to, empty } = state.selection;

  return getLinkRanges(state).find((range) =>
    empty
      ? from > range.from && from < range.to
      : from >= range.from && to <= range.to,
  );
}
