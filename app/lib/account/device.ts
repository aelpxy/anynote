const storageKey = "anynote:device";

export type RememberedDevice = {
  username: string;
  secretKey: string;
};

export function getRememberedDevice(): RememberedDevice | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as RememberedDevice | null;
    return stored?.username && stored.secretKey ? stored : null;
  } catch {
    return null;
  }
}

export function rememberDevice(device: RememberedDevice) {
  localStorage.setItem(storageKey, JSON.stringify(device));
}

export function forgetDevice() {
  localStorage.removeItem(storageKey);
}
