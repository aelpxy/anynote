import type { Node } from "@milkdown/kit/prose/model";
import type { EditorView } from "@milkdown/kit/prose/view";
import { Captions, Download, Maximize2, RotateCcw } from "lucide-react";

import { EditorToolbarButton } from "~/components/editor-toolbar-button";
import { EditorToolbarSeparator } from "~/components/editor-toolbar-separator";
import { FloatingToolbar } from "~/components/floating-toolbar";
import { zoomImageEvent, type ZoomImageDetail } from "~/lib/encrypted-image-view";

type ImageToolbarProps = {
  view: EditorView;
  pos: number;
  node: Node;
  onEditCaption: () => void;
};

async function downloadImage(image: HTMLImageElement, name: string) {
  const blob = await (await fetch(image.src)).blob();
  const extension = blob.type.split("/")[1] ?? "png";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name || "image"}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ImageToolbar({ view, pos, node, onEditCaption }: ImageToolbarProps) {
  const wrapper = view.nodeDOM(pos);
  const image = wrapper instanceof Element ? wrapper.querySelector("img") : null;
  if (!(wrapper instanceof Element) || !image) return null;

  const alt = String(node.attrs.alt ?? "");
  const isReady = Boolean(image.getAttribute("src")) && !image.classList.contains("is-broken");

  return (
    <FloatingToolbar reference={wrapper} label="Image" placement="top">
      <EditorToolbarButton
        icon={Maximize2}
        label="View full size"
        disabled={!isReady}
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent<ZoomImageDetail>(zoomImageEvent, {
              detail: { src: image.src, alt, caption: String(node.attrs.title ?? "") },
            }),
          )
        }
      />
      <EditorToolbarButton icon={Captions} label="Edit caption" onClick={onEditCaption} />
      <EditorToolbarButton
        icon={RotateCcw}
        label="Reset size"
        disabled={!node.attrs.width}
        onClick={() => {
          view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: null }));
          view.focus();
        }}
      />
      <EditorToolbarSeparator />
      <EditorToolbarButton
        icon={Download}
        label="Download"
        disabled={!isReady}
        onClick={() => void downloadImage(image, alt)}
      />
    </FloatingToolbar>
  );
}
