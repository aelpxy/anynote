const version = "A1";
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const keyLength = 16;
const encodedLength = 26;

function encodeBase32(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(value: string) {
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];

  for (const char of value) {
    const index = alphabet.indexOf(char);
    if (index === -1) return null;
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(bytes);
}

export function generateSecretKey() {
  return version + encodeBase32(crypto.getRandomValues(new Uint8Array(keyLength)));
}

// accepts any casing, spacing and dashes, plus the usual Crockford look-alikes
export function parseSecretKey(input: string) {
  const normalized = input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (!normalized.startsWith(version)) return null;

  const encoded = normalized.slice(version.length);
  if (encoded.length !== encodedLength) return null;

  const bytes = decodeBase32(encoded);
  if (!bytes || bytes.length !== keyLength) return null;

  // reject non-canonical padding bits so each key has exactly one spelling
  return encodeBase32(bytes) === encoded ? version + encoded : null;
}

export function formatSecretKey(secretKey: string) {
  const encoded = secretKey.slice(version.length);
  const groups = [0, 5, 10, 15, 20].map((start, index) =>
    encoded.slice(start, index === 4 ? undefined : start + 5),
  );
  return [version, ...groups].join("-");
}
