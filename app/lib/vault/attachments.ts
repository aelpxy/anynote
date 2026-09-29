import { downloadAttachment, uploadAttachment } from "~/lib/api/attachments";
import { decryptAttachment, encryptAttachment } from "~/lib/crypto/attachment";
import type { Vault } from "~/lib/vault/types";

export const attachmentScheme = "attachment:";

// the server caps uploads at 10 MiB of ciphertext; leave room for the encryption overhead
export const maxAttachmentBytes = 10 * 1024 * 1024 - 64 * 1024;

const objectUrls = new Map<string, Promise<string>>();

export function getAttachmentId(src: string) {
  return src.startsWith(attachmentScheme) ? src.slice(attachmentScheme.length) : null;
}

export async function saveAttachment(vault: Vault, file: File) {
  if (file.size > maxAttachmentBytes) throw new Error(`${file.name} is larger than 10 MB`);

  const id = crypto.randomUUID();
  const data = new Uint8Array(await file.arrayBuffer());
  const encrypted = await encryptAttachment(
    vault,
    id,
    { name: file.name, type: file.type, size: file.size },
    data,
  );
  await uploadAttachment(vault.token, vault.workspaceId, id, encrypted);

  objectUrls.set(id, Promise.resolve(URL.createObjectURL(new Blob([data], { type: file.type }))));
  return `${attachmentScheme}${id}`;
}

// each attachment is fetched and decrypted once per session, then served from a blob: url
export function resolveAttachmentUrl(vault: Vault, attachmentId: string) {
  let url = objectUrls.get(attachmentId);
  if (!url) {
    url = downloadAttachment(vault.token, vault.workspaceId, attachmentId)
      .then((file) => decryptAttachment(vault, attachmentId, file))
      .then(({ metadata, data }) => URL.createObjectURL(new Blob([data], { type: metadata.type })));
    url.catch(() => objectUrls.delete(attachmentId));
    objectUrls.set(attachmentId, url);
  }
  return url;
}

export function revokeAttachmentUrls() {
  for (const url of objectUrls.values()) {
    void url.then((value) => URL.revokeObjectURL(value)).catch(() => undefined);
  }
  objectUrls.clear();
}
