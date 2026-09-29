import { imageSchema } from "@milkdown/kit/preset/commonmark";
import type { Node } from "@milkdown/kit/prose/model";
import { $view } from "@milkdown/kit/utils";

import { getAttachmentId, resolveAttachmentUrl } from "~/lib/vault/attachments";
import { getVault } from "~/lib/vault/store";

export const zoomImageEvent = "anynote:zoom-image";

export type ZoomImageDetail = {
  src: string;
  alt: string;
  caption: string;
};

const minImageWidth = 80;

// attachment: urls point at encrypted files, so the image is fetched and decrypted before it can show
export const encryptedImageView = $view(imageSchema.node, () => (initialNode, view, getPos) => {
  const wrapper = document.createElement("span");
  wrapper.className = "note-image";
  const image = document.createElement("img");
  const handle = document.createElement("span");
  handle.className = "note-image-handle";
  handle.setAttribute("aria-hidden", "true");
  const caption = document.createElement("span");
  caption.className = "note-image-caption";
  wrapper.append(image, handle, caption);

  let node = initialNode;
  let currentSrc = "";
  let didResize = false;

  function render(next: Node) {
    image.alt = String(next.attrs.alt ?? "");
    const width = next.attrs.width as number | null;
    image.style.width = width ? `${width}px` : "";
    const title = String(next.attrs.title ?? "");
    caption.textContent = title;
    caption.hidden = !title;

    const src = String(next.attrs.src ?? "");
    if (src === currentSrc) return;
    currentSrc = src;

    const attachmentId = getAttachmentId(src);
    const vault = getVault();
    if (!attachmentId || !vault) {
      image.src = src;
      return;
    }

    image.removeAttribute("src");
    image.classList.add("is-loading");
    resolveAttachmentUrl(vault, attachmentId)
      .then((url) => {
        if (currentSrc !== src) return;
        image.src = url;
        image.classList.remove("is-loading");
      })
      .catch(() => {
        image.classList.replace("is-loading", "is-broken");
        image.alt = "This image couldn't be decrypted";
      });
  }

  function setWidth(width: number | null) {
    const pos = getPos();
    if (pos === undefined) return;
    view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width }));
  }

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = image.getBoundingClientRect().width;
    const maxWidth = view.dom.clientWidth;
    const widthAt = (clientX: number) =>
      Math.round(Math.min(maxWidth, Math.max(minImageWidth, startWidth + clientX - startX)));

    const move = (moveEvent: PointerEvent) => {
      image.style.width = `${widthAt(moveEvent.clientX)}px`;
    };
    const end = (endEvent: PointerEvent) => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      didResize = true;
      setWidth(widthAt(endEvent.clientX));
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
  });

  handle.addEventListener("dblclick", () => setWidth(null));

  image.addEventListener("click", () => {
    if (didResize || !image.src || image.classList.contains("is-broken")) {
      didResize = false;
      return;
    }
    window.dispatchEvent(
      new CustomEvent<ZoomImageDetail>(zoomImageEvent, {
        detail: { src: image.src, alt: image.alt, caption: caption.textContent ?? "" },
      }),
    );
  });

  render(node);
  return {
    dom: wrapper,
    update(next) {
      if (next.type !== node.type) return false;
      node = next;
      render(next);
      return true;
    },
    stopEvent: (event) => event.target === handle,
    ignoreMutation: () => true,
  };
});
