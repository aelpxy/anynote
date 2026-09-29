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

async function readClipboardImage() {
  for (const item of await navigator.clipboard.read()) {
    const type = item.types.find((itemType) => itemType.startsWith("image/"));
    if (type) {
      const blob = await item.getType(type);
      return new File([blob], `pasted-image.${type.split("/")[1]}`, { type });
    }
  }
  return null;
}

export async function pasteFromClipboard(view: EditorView) {
  const image = await readClipboardImage().catch(() => null);
  view.focus();

  if (image) {
    // a synthetic paste event goes through the upload plugin, placeholder and all
    const clipboardData = new DataTransfer();
    clipboardData.items.add(image);
    view.dom.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }),
    );
    return;
  }

  // pasteText runs the normal paste pipeline, so markdown and links are handled like ctrl+v
  view.pasteText(await navigator.clipboard.readText());
}
