import { useDeferredValue } from "react";

import { toPlainText } from "~/lib/vault/plain-text";

const wordsPerMinute = 200;

const saveLabels = { saving: "Saving…", unsynced: "Not synced yet", saved: "Saved" };

type NoteStatusProps = {
  markdown: string;
  saveState: "idle" | "saving" | "unsynced" | "saved";
};

export function countWords(markdown: string) {
  return toPlainText(markdown).split(/\s+/).filter(Boolean).length;
}

export function NoteStatus({ markdown, saveState }: NoteStatusProps) {
  const words = countWords(useDeferredValue(markdown));
  const minutes = Math.max(1, Math.round(words / wordsPerMinute));

  return (
    <p className="mr-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
      {saveState !== "idle" && (
        <>
          <span>{saveLabels[saveState]}</span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
        </>
      )}
      <span className="hidden sm:inline">
        {words.toLocaleString()} {words === 1 ? "word" : "words"}
      </span>
      {words > 0 && (
        <span className="hidden gap-1.5 sm:flex">
          <span aria-hidden>·</span>
          <span>{minutes} min read</span>
        </span>
      )}
    </p>
  );
}
