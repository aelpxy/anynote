import { contexts } from "~/lib/crypto/contexts";
import { concatBytes, fromUtf8, toUtf8 } from "~/lib/crypto/encoding";
import { openEnvelope, sealEnvelope } from "~/lib/crypto/envelope";
import { getSodium } from "~/lib/crypto/sodium";

const version = 0x01;
const chunkSize = 64 * 1024;
const wrappedKeyLength = 1 + 24 + 32 + 16;

export type AttachmentMetadata = {
  name: string;
  type: string;
  size: number;
};

type Keys = {
  workspaceId: string;
  workspaceKey: Uint8Array;
};

function toUint32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
}

export async function encryptAttachment(
  keys: Keys,
  attachmentId: string,
  metadata: AttachmentMetadata,
  data: Uint8Array,
) {
  const sodium = await getSodium();
  const fileKey = sodium.crypto_secretstream_xchacha20poly1305_keygen();
  const wrappedKey = await sealEnvelope(
    keys.workspaceKey,
    fileKey,
    contexts.attachment(keys.workspaceId, attachmentId),
  );
  const { state, header } = sodium.crypto_secretstream_xchacha20poly1305_init_push(fileKey);
  const push = (chunk: Uint8Array, tag: number) =>
    sodium.crypto_secretstream_xchacha20poly1305_push(state, chunk, null, tag);

  const encryptedMetadata = push(
    toUtf8(JSON.stringify(metadata)),
    sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE,
  );
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < data.length || chunks.length === 0; offset += chunkSize) {
    const isLast = offset + chunkSize >= data.length;
    chunks.push(
      push(
        data.subarray(offset, offset + chunkSize),
        isLast
          ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
          : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE,
      ),
    );
  }

  return concatBytes(
    Uint8Array.of(version),
    wrappedKey,
    header,
    toUint32(encryptedMetadata.length),
    encryptedMetadata,
    ...chunks,
  );
}

export async function decryptAttachment(keys: Keys, attachmentId: string, file: Uint8Array) {
  const sodium = await getSodium();
  const headerLength = sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES;
  const tagLength = sodium.crypto_secretstream_xchacha20poly1305_ABYTES;
  if (file[0] !== version) throw new Error("Unsupported attachment version");

  let offset = 1;
  const fileKey = await openEnvelope(
    keys.workspaceKey,
    file.subarray(offset, (offset += wrappedKeyLength)),
    contexts.attachment(keys.workspaceId, attachmentId),
  );
  const state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
    file.subarray(offset, (offset += headerLength)),
    fileKey,
  );
  const pull = (chunk: Uint8Array) => {
    const result = sodium.crypto_secretstream_xchacha20poly1305_pull(state, chunk, null);
    if (!result) throw new Error("Attachment failed to decrypt");
    return result;
  };

  const metadataLength = new DataView(file.buffer, file.byteOffset + offset, 4).getUint32(0);
  offset += 4;
  const metadata = JSON.parse(
    fromUtf8(pull(file.subarray(offset, (offset += metadataLength))).message),
  ) as AttachmentMetadata;

  const parts: Uint8Array[] = [];
  let isFinal = false;
  while (offset < file.length) {
    const { message, tag } = pull(file.subarray(offset, (offset += chunkSize + tagLength)));
    parts.push(message);
    isFinal = tag === sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL;
    if (isFinal) break;
  }
  // a missing final tag means the file was cut short
  if (!isFinal || offset < file.length) throw new Error("Attachment is truncated or corrupted");

  return { metadata, data: concatBytes(...parts) };
}
