import { concatBytes, fromUtf8, toUtf8 } from "~/lib/crypto/encoding";
import { getSodium } from "~/lib/crypto/sodium";

const version = 0x01;

export async function sealEnvelope(key: Uint8Array, plaintext: Uint8Array, context: string) {
  const sodium = await getSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plaintext,
    toUtf8(context),
    null,
    nonce,
    key,
  );
  return concatBytes(Uint8Array.of(version), nonce, ciphertext);
}

export async function openEnvelope(key: Uint8Array, envelope: Uint8Array, context: string) {
  const sodium = await getSodium();
  const nonceLength = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
  if (envelope[0] !== version) throw new Error("Unsupported envelope version");

  return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    envelope.subarray(1 + nonceLength),
    toUtf8(context),
    envelope.subarray(1, 1 + nonceLength),
    key,
  );
}

export async function sealJson(key: Uint8Array, value: unknown, context: string) {
  return sealEnvelope(key, toUtf8(JSON.stringify(value)), context);
}

export async function openJson<T>(key: Uint8Array, envelope: Uint8Array, context: string) {
  return JSON.parse(fromUtf8(await openEnvelope(key, envelope, context))) as T;
}
