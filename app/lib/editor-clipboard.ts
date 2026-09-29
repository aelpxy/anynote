import type { EditorView } from "@milkdown/kit/prose/view";

// menu clicks move focus away, so the editor is refocused to restore the dom selection first
export function copySelection(view: EditorView) {
  view.focus();
  document.execCommand("copy");
}

export function cutSelection(view: EditorView) {
  view.focus();
  document.execCommand("cut");
}

export async function pasteFromClipboard(view: EditorView) {
  const text = await navigator.clipboard.readText();
  view.focus();
  // pasteText runs the normal paste pipeline, so markdown and links are handled like ctrl+v
  view.pasteText(text);
}
