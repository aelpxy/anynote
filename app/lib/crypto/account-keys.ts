import {
  bytesEqual,
  concatBytes,
  fromBase64Url,
  toUtf8,
  uuidToBytes,
} from "~/lib/crypto/encoding";
import { getSodium } from "~/lib/crypto/sodium";

export function toPasswordInput(secretKey: string, password: string) {
  return `${secretKey}:${password.normalize("NFKC")}`;
}

export async function deriveAccountUnlockKey(exportKey: string) {
  const material = await crypto.subtle.importKey(
    "raw",
    fromBase64Url(exportKey),
    "HKDF",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toUtf8("anynote"),
      info: toUtf8("anynote/v1/account-unlock-key"),
    },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export async function generateKeyPair() {
  const sodium = await getSodium();
  const { publicKey, privateKey } = sodium.crypto_box_keypair();
  return { publicKey, privateKey };
}

export async function generateWorkspaceKey() {
  const sodium = await getSodium();
  return sodium.randombytes_buf(32);
}

export async function sealWorkspaceKey(workspaceId: string, workspaceKey: Uint8Array, publicKey: Uint8Array) {
  const sodium = await getSodium();
  return sodium.crypto_box_seal(concatBytes(uuidToBytes(workspaceId), workspaceKey), publicKey);
}

export async function openWorkspaceKey(
  workspaceId: string,
  sealed: Uint8Array,
  publicKey: Uint8Array,
  privateKey: Uint8Array,
) {
  const sodium = await getSodium();
  const opened = sodium.crypto_box_seal_open(sealed, publicKey, privateKey);
  // the sealed box has no associated data, so the workspace id is checked by hand
  if (!bytesEqual(opened.subarray(0, 16), uuidToBytes(workspaceId))) {
    throw new Error("Workspace key belongs to a different workspace");
  }
  return opened.slice(16);
}
