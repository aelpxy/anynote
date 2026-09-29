export const noteAppearanceOptions = {
  font: ["default", "serif", "mono", "system"],
  size: ["small", "default", "large"],
  spacing: ["compact", "default", "relaxed"],
  width: ["normal", "wide"],
} as const;

type Options = typeof noteAppearanceOptions;

export type NoteAppearanceKey = keyof Options;

export type NoteAppearance = { [Key in NoteAppearanceKey]: Options[Key][number] };

export const defaultNoteAppearance: NoteAppearance = {
  font: "default",
  size: "default",
  spacing: "default",
  width: "normal",
};

const storageKey = "anynote:note-appearance";
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: NoteAppearance } | null = null;

function isOption<Key extends NoteAppearanceKey>(key: Key, value: unknown): value is Options[Key][number] {
  return (noteAppearanceOptions[key] as readonly unknown[]).includes(value);
}

function parse(raw: string | null): NoteAppearance {
  let stored: Record<string, unknown> = {};
  try {
    stored = raw ? JSON.parse(raw) : {};
  } catch {}
  const appearance = { ...defaultNoteAppearance };
  for (const key of Object.keys(noteAppearanceOptions) as NoteAppearanceKey[]) {
    if (isOption(key, stored[key])) (appearance as Record<string, unknown>)[key] = stored[key];
  }
  return appearance;
}

// returns the same object until storage changes, as useSyncExternalStore requires
export function getStoredNoteAppearance(): NoteAppearance {
  if (typeof window === "undefined") return defaultNoteAppearance;
  const raw = localStorage.getItem(storageKey);
  if (cached?.raw !== raw) cached = { raw, value: parse(raw) };
  return cached.value;
}

export function setNoteAppearance<Key extends NoteAppearanceKey>(
  key: Key,
  value: NoteAppearance[Key],
) {
  const next = { ...getStoredNoteAppearance(), [key]: value };
  localStorage.setItem(storageKey, JSON.stringify(next));
  applyNoteAppearance(next);
  for (const listener of listeners) listener();
}

export function subscribeToNoteAppearance(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey) return;
    applyNoteAppearance(getStoredNoteAppearance());
    listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

// self-contained so it can also be inlined as a blocking script before first paint
export function applyNoteAppearance(appearance: Record<string, string>) {
  for (const key in appearance) {
    document.documentElement.setAttribute(`data-note-${key}`, appearance[key]);
  }
}

export function getNoteAppearanceScript() {
  return `try{(${applyNoteAppearance.toString()})(JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||"{}"))}catch(e){}`;
}
