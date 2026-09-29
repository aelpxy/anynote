import type { EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { closeFind, findPluginKey, setFindQuery, stepFindMatch } from "~/lib/find-plugin";

type FindBarProps = {
  view: EditorView;
  state: EditorState;
  initialQuery: string;
  focusRequest: number;
  onClose: () => void;
};

const iconButton =
  "rounded p-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100";

export function FindBar({ view, state, initialQuery, focusRequest, onClose }: FindBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, matches, current } = findPluginKey.getState(state) ?? {
    query: "",
    matches: [],
    current: 0,
  };

  useEffect(() => {
    if (initialQuery) setFindQuery(view, initialQuery);
  }, [view, initialQuery]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusRequest]);

  function close() {
    closeFind(view);
    onClose();
  }

  return (
    <div
      role="search"
      className="fixed top-16 right-3 left-3 z-20 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 pl-3 shadow-lg shadow-neutral-900/10 sm:left-auto sm:w-80 print:hidden dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
    >
      <input
        ref={inputRef}
        aria-label="Find in note"
        placeholder="Find in note"
        defaultValue={initialQuery}
        onChange={(event) => setFindQuery(view, event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            stepFindMatch(view, event.shiftKey ? -1 : 1);
          } else if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
        className="h-7 min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400"
      />
      <span aria-live="polite" className="px-1 text-xs whitespace-nowrap text-neutral-500 dark:text-neutral-400 tabular-nums">
        {query ? (matches.length ? `${current + 1}/${matches.length}` : "No results") : ""}
      </span>
      <button
        type="button"
        aria-label="Previous match"
        disabled={matches.length === 0}
        onClick={() => stepFindMatch(view, -1)}
        className={iconButton}
      >
        <ChevronUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Next match"
        disabled={matches.length === 0}
        onClick={() => stepFindMatch(view, 1)}
        className={iconButton}
      >
        <ChevronDown className="size-4" />
      </button>
      <button type="button" aria-label="Close find" onClick={close} className={iconButton}>
        <X className="size-4" />
      </button>
    </div>
  );
}
