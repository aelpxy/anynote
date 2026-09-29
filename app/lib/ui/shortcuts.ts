export const saveNowEvent = "anynote:save-now";

export type Shortcut = {
  keys: string[];
  label: string;
};

export type ShortcutGroup = {
  heading: string;
  shortcuts: Shortcut[];
};

export const shortcutGroups: ShortcutGroup[] = [
  {
    heading: "General",
    shortcuts: [
      { keys: ["Mod", "K"], label: "Search and commands" },
      { keys: ["Mod", "S"], label: "Save now" },
      { keys: ["Mod", "F"], label: "Find in note" },
      { keys: ["Mod", "Shift", "F"], label: "Search all notes" },
      { keys: ["Mod", "Alt", "N"], label: "New note" },
      { keys: ["?"], label: "Keyboard shortcuts" },
      { keys: ["Mod", "Z"], label: "Undo the last move or delete" },
    ],
  },
  {
    heading: "Layout",
    shortcuts: [
      { keys: ["Mod", "\\"], label: "Toggle sidebar" },
      { keys: ["Mod", "."], label: "Toggle focus mode" },
    ],
  },
  {
    heading: "Navigation",
    shortcuts: [
      { keys: ["Mod", "Alt", "↑"], label: "Previous note" },
      { keys: ["Mod", "Alt", "↓"], label: "Next note" },
    ],
  },
  {
    heading: "Sidebar",
    shortcuts: [
      { keys: ["Mod", "Click"], label: "Select notes" },
      { keys: ["Shift", "Click"], label: "Select a range" },
      { keys: ["Esc"], label: "Clear selection" },
      { keys: ["F2"], label: "Rename the focused note or collection" },
    ],
  },
  {
    heading: "Editor",
    shortcuts: [
      { keys: ["Mod", "B"], label: "Bold" },
      { keys: ["Mod", "I"], label: "Italic" },
      { keys: ["Mod", "E"], label: "Inline code" },
      { keys: ["Mod", "Z"], label: "Undo" },
      { keys: ["Mod", "Shift", "Z"], label: "Redo" },
    ],
  },
];

export function isMac() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
}

export function formatKey(key: string) {
  const mac = isMac();
  if (key === "Mod") return mac ? "⌘" : "Ctrl";
  if (key === "Alt") return mac ? "⌥" : "Alt";
  if (key === "Shift") return mac ? "⇧" : "Shift";
  return key;
}

export function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}
