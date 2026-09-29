import { posToDOMRect } from "@milkdown/kit/prose";
import type { EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { FileText } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { FloatingLayer } from "~/components/floating-layer";
import type { KeyInterceptor } from "~/lib/key-intercept-plugin";
import { findNoteLinkTrigger } from "~/lib/note-link-trigger";
import type { Note } from "~/lib/vault/types";

const maxSuggestions = 8;

type NoteLinkSuggestProps = {
  view: EditorView;
  state: EditorState;
  notes: Note[];
  interceptorRef: { current: KeyInterceptor | null };
};

function rank(notes: Note[], query: string) {
  const needle = query.trim().toLowerCase();
  return notes
    .filter((note) => note.title.toLowerCase().includes(needle))
    .sort(
      (a, b) =>
        Number(b.title.toLowerCase().startsWith(needle)) -
        Number(a.title.toLowerCase().startsWith(needle)),
    )
    .slice(0, maxSuggestions);
}

export function NoteLinkSuggest({ view, state, notes, interceptorRef }: NoteLinkSuggestProps) {
  const trigger = findNoteLinkTrigger(state);
  const [dismissedFrom, setDismissedFrom] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const query = trigger?.query ?? "";
  const matches = trigger ? rank(notes, query) : [];
  const isOpen = trigger !== null && trigger.from !== dismissedFrom && matches.length > 0;

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    const editor = view.dom;
    if (!isOpen) return;
    editor.setAttribute("aria-autocomplete", "list");
    editor.setAttribute("aria-controls", listId);
    editor.setAttribute("aria-expanded", "true");
    editor.setAttribute("aria-activedescendant", `${listId}-${activeIndex}`);
    return () => {
      for (const name of ["aria-autocomplete", "aria-controls", "aria-expanded", "aria-activedescendant"]) {
        editor.removeAttribute(name);
      }
    };
  }, [view, isOpen, listId, activeIndex]);

  function insert(note: Note) {
    if (!trigger) return;
    const { schema } = view.state;
    const link = schema.marks.link.create({ href: `/notes/${note.id}` });
    view.dispatch(
      view.state.tr
        .replaceWith(trigger.from, trigger.to, schema.text(note.title, [link]))
        .removeStoredMark(schema.marks.link),
    );
    view.focus();
  }

  useEffect(() => {
    interceptorRef.current = isOpen
      ? (event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const offset = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((index) => (index + offset + matches.length) % matches.length);
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            insert(matches[Math.min(activeIndex, matches.length - 1)]);
            return true;
          }
          if (event.key === "Escape") {
            setDismissedFrom(trigger.from);
            return true;
          }
          return false;
        }
      : null;
  });

  if (!isOpen) return null;

  const reference = {
    getBoundingClientRect: () => posToDOMRect(view, trigger.from, trigger.to),
    contextElement: view.dom,
  };

  return (
    <FloatingLayer
      reference={reference}
      placement="bottom-start"
      id={listId}
      role="listbox"
      aria-label="Link to note"
      className="z-40 w-64 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
    >
      {matches.map((note, index) => (
        <button
          key={note.id}
          id={`${listId}-${index}`}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => insert(note)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 aria-selected:bg-neutral-100 aria-selected:text-neutral-900 dark:text-neutral-300 dark:aria-selected:bg-neutral-700 dark:aria-selected:text-neutral-100"
        >
          {note.icon ? (
            <span aria-hidden className="flex size-4 shrink-0 items-center justify-center text-sm leading-none">
              {note.icon}
            </span>
          ) : (
            <FileText className="size-4 shrink-0" />
          )}
          <span className="truncate">{note.title}</span>
        </button>
      ))}
    </FloatingLayer>
  );
}
