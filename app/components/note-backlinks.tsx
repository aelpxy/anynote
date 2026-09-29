import { FileText } from "lucide-react";
import { Link } from "react-router";

import type { Note } from "~/lib/vault/types";

type NoteBacklinksProps = {
  notes: Note[];
};

export function NoteBacklinks({ notes }: NoteBacklinksProps) {
  if (notes.length === 0) return null;

  return (
    <section className="mt-10 border-t border-neutral-200 pt-4 print:hidden dark:border-neutral-800">
      <h2 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Linked from</h2>
      <ul className="mt-2 flex flex-col gap-0.5">
        {notes.map((note) => (
          <li key={note.id}>
            <Link
              to={`/notes/${note.id}`}
              className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            >
              {note.icon ? (
                <span aria-hidden className="flex size-4 shrink-0 items-center justify-center text-sm leading-none">
                  {note.icon}
                </span>
              ) : (
                <FileText className="size-4 shrink-0" />
              )}
              <span className="truncate">{note.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
