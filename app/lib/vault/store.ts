import type { Vault } from "~/lib/vault/types";

// decrypted notes live only in memory for the unlocked session
let vault: Vault | null = null;

export function getVault() {
  return vault;
}

export function setVault(next: Vault | null) {
  vault = next;
}
