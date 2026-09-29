import type { Node } from "@milkdown/kit/prose/model";
import { Plugin, PluginKey, TextSelection } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet, type EditorView } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";

export type FindMatch = { from: number; to: number };

export type FindState = {
  query: string;
  matches: FindMatch[];
  current: number;
};

type FindMeta = { query: string } | { current: number };

export const findPluginKey = new PluginKey<FindState>("anynote-find");

const emptyState: FindState = { query: "", matches: [], current: 0 };

function findMatches(doc: Node, query: string) {
  const needle = query.toLowerCase();
  const matches: FindMatch[] = [];
  if (!needle) return matches;

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    if (node.type.spec.code) return false;

    let text = "";
    const positions: number[] = [];
    node.forEach((child, offset) => {
      const start = pos + 1 + offset;
      const value = child.isText ? child.text! : "￼";
      for (let i = 0; i < value.length; i += 1) positions.push(start + i);
      text += value;
    });

    const haystack = text.toLowerCase();
    for (let index = haystack.indexOf(needle); index !== -1; index = haystack.indexOf(needle, index + needle.length)) {
      matches.push({ from: positions[index], to: positions[index + needle.length - 1] + 1 });
    }
    return false;
  });
  return matches;
}

export const findPlugin = $prose(
  () =>
    new Plugin<FindState>({
      key: findPluginKey,
      state: {
        init: () => emptyState,
        apply(tr, value) {
          const meta = tr.getMeta(findPluginKey) as FindMeta | undefined;
          if (meta && "query" in meta) {
            return { query: meta.query, matches: findMatches(tr.doc, meta.query), current: 0 };
          }
          if (meta && "current" in meta) return { ...value, current: meta.current };
          if (tr.docChanged && value.query) {
            const matches = findMatches(tr.doc, value.query);
            return { ...value, matches, current: Math.min(value.current, Math.max(0, matches.length - 1)) };
          }
          return value;
        },
      },
      props: {
        decorations(state) {
          const { matches, current } = findPluginKey.getState(state) ?? emptyState;
          if (matches.length === 0) return null;
          return DecorationSet.create(
            state.doc,
            matches.map((match, index) =>
              Decoration.inline(match.from, match.to, {
                class: index === current ? "find-match find-match-current" : "find-match",
              }),
            ),
          );
        },
      },
    }),
);

export function getFindState(view: EditorView) {
  return findPluginKey.getState(view.state) ?? emptyState;
}

function scrollToCurrentMatch() {
  requestAnimationFrame(() => {
    document.querySelector(".find-match-current")?.scrollIntoView({ block: "center" });
  });
}

export function setFindQuery(view: EditorView, query: string) {
  view.dispatch(view.state.tr.setMeta(findPluginKey, { query }));
  scrollToCurrentMatch();
}

export function stepFindMatch(view: EditorView, offset: number) {
  const { matches, current } = getFindState(view);
  if (matches.length === 0) return;
  const next = (current + offset + matches.length) % matches.length;
  view.dispatch(view.state.tr.setMeta(findPluginKey, { current: next }));
  scrollToCurrentMatch();
}

export function closeFind(view: EditorView) {
  const { matches, current } = getFindState(view);
  const match = matches[current];
  const tr = view.state.tr.setMeta(findPluginKey, { query: "" });
  if (match) tr.setSelection(TextSelection.create(tr.doc, match.from, match.to));
  view.dispatch(tr);
  view.focus();
}
