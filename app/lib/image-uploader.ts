import type { Node } from "@milkdown/kit/prose/model";
import { Decoration } from "@milkdown/kit/prose/view";
import type { UploadOptions } from "@milkdown/kit/plugin/upload";

import { saveAttachment } from "~/lib/vault/attachments";
import { getVault } from "~/lib/vault/store";

function getAltText(file: File) {
  return file.name.replace(/\.[^.]+$/, "");
}

// never throws: milkdown leaves the upload placeholder behind if the uploader rejects
export const imageUploader: UploadOptions["uploader"] = async (files, schema) => {
  const vault = getVault();
  if (!vault) return [];
  const images = Array.from(files).filter((file) => file.type.startsWith("image/"));

  const nodes = await Promise.all(
    images.map(async (file) => {
      try {
        const src = await saveAttachment(vault, file);
        return schema.nodes.image.createAndFill({ src, alt: getAltText(file) });
      } catch (error) {
        console.error(`Failed to upload ${file.name}`, error);
        return null;
      }
    }),
  );

  return nodes.filter((node): node is Node => node !== null);
};

export const uploadPlaceholder: UploadOptions["uploadWidgetFactory"] = (pos, spec) => {
  const placeholder = document.createElement("span");
  placeholder.className = "upload-placeholder";
  placeholder.textContent = "Encrypting image…";
  return Decoration.widget(pos, placeholder, spec);
};
