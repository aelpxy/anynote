import { useDeferredValue } from "react";

import { toPlainText } from "~/lib/vault/plain-text";

const wordsPerMinute = 200;

type NoteStatusProps = {
  markdown: string;
  saveState: "idle" | "saving" | "saved";
};

function countWords(markdown: string) {
  return toPlainText(markdown).split(/\s+/).filter(Boolean).length;
}

export function NoteStatus({ markdown, saveState }: NoteStatusProps) {
  const words = countWords(useDeferredValue(markdown));
  const minutes = Math.max(1, Math.round(words / wordsPerMinute));

  return (
    <p className="mr-2 flex items-center gap-1.5 text-xs text-neutral-500 tabular-nums">
      {saveState !== "idle" && (
        <>
          <span>{saveState === "saving" ? "Saving…" : "Saved"}</span>
          <span aria-hidden>·</span>
        </>
      )}
      <span>
        {words.toLocaleString()} {words === 1 ? "word" : "words"}
      </span>
      {words > 0 && (
        <>
          <span aria-hidden>·</span>
          <span>{minutes} min read</span>
        </>
      )}
    </p>
  );
}
