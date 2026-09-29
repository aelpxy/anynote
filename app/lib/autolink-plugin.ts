import { Plugin, PluginKey, type EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";

import { toSafeHref } from "~/lib/safe-url";
import {
  detectMarkdownLink,
  detectTrailingLink,
  isLinkLike,
  toHref,
} from "~/lib/link-detection";

function getTextBefore(state: EditorState, pos: number) {
  const $pos = state.doc.resolve(pos);
  if (!$pos.parent.isTextblock || $pos.parent.type.spec.code) return;
  if (state.schema.marks.inlineCode.isInSet($pos.marks())) return;

  // leaf nodes count as one character so string offsets map back to positions
  return $pos.parent.textBetween(0, $pos.parentOffset, undefined, "￼");
}

function linkTrailingWord(state: EditorState, pos: number) {
  const textBefore = getTextBefore(state, pos);
  const link = textBefore && detectTrailingLink(textBefore);
  if (!textBefore || !link) return;

  const { link: linkType, inlineCode } = state.schema.marks;
  const from = pos - (textBefore.length - link.start);
  const to = pos - (textBefore.length - link.end);
  const isAlreadyMarked =
    state.doc.rangeHasMark(from, to, linkType) ||
    state.doc.rangeHasMark(from, to, inlineCode);
  if (isAlreadyMarked) return;

  return state.tr.addMark(from, to, linkType.create({ href: link.href }));
}

function handleWhitespace(view: EditorView, from: number, to: number, text: string) {
  const tr = linkTrailingWord(view.state, from);
  if (!tr) return false;

  // links are inclusive marks, so keep the typed space outside the link
  tr.insertText(text, from, to).removeMark(
    from,
    from + text.length,
    view.state.schema.marks.link,
  );
  view.dispatch(tr);
  return true;
}

function handleMarkdownLink(view: EditorView, from: number, to: number) {
  const { state } = view;
  const textBefore = getTextBefore(state, from);
  const link = textBefore && detectMarkdownLink(textBefore);
  if (!textBefore || !link) return false;

  // an unsafe url stays as the plain text that was typed
  const href = toSafeHref(link.href);
  if (!href) return false;

  const start = from - (textBefore.length - link.start);
  const linkMark = state.schema.marks.link.create({ href });
  view.dispatch(
    state.tr
      .replaceWith(start, to, state.schema.text(link.label, [linkMark]))
      .removeStoredMark(state.schema.marks.link),
  );
  return true;
}

export function createAutolinkPlugin() {
  return new Plugin({
    key: new PluginKey("autolink"),
    props: {
      handleTextInput(view, from, to, text) {
        if (text === ")") return handleMarkdownLink(view, from, to);
        if (/^\s$/.test(text)) return handleWhitespace(view, from, to, text);
        return false;
      },
      handleKeyDown(view, event) {
        const isPlainEnter =
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey;
        if (!isPlainEnter || !view.state.selection.empty) return false;

        const tr = linkTrailingWord(view.state, view.state.selection.from);
        if (tr) view.dispatch(tr);
        // let the default Enter behaviour run after linking
        return false;
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain").trim() ?? "";
        const { selection, schema } = view.state;
        if (selection.empty || !isLinkLike(text)) return false;
        if (getTextBefore(view.state, selection.from) === undefined) return false;

        const href = toHref(text);
        if (!href) return false;

        view.dispatch(
          view.state.tr.addMark(
            selection.from,
            selection.to,
            schema.marks.link.create({ href }),
          ),
        );
        return true;
      },
    },
  });
}

export const autolinkPlugin = $prose(createAutolinkPlugin);
