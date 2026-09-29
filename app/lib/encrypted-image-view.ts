import { imageSchema } from "@milkdown/kit/preset/commonmark";
import type { Node } from "@milkdown/kit/prose/model";
import { $view } from "@milkdown/kit/utils";

import { getAttachmentId, resolveAttachmentUrl } from "~/lib/vault/attachments";
import { getVault } from "~/lib/vault/store";

// attachment: urls point at encrypted files, so the image is fetched and decrypted before it can show
export const encryptedImageView = $view(imageSchema.node, () => (initialNode) => {
  const image = document.createElement("img");
  let node = initialNode;
  let currentSrc = "";

  function render(next: Node) {
    image.alt = String(next.attrs.alt ?? "");
    image.title = String(next.attrs.title ?? "");
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

  render(node);
  return {
    dom: image,
    update(next) {
      if (next.type !== node.type) return false;
      node = next;
      render(next);
      return true;
    },
  };
});
