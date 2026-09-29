import { FileText, Star } from "lucide-react";
import { Link } from "react-router";

import { NewNoteButton } from "~/components/new-note-button";
import { formatRelativeTime } from "~/lib/relative-time";
import type { Note } from "~/lib/vault/types";

type HomeRecentNotesProps = {
  notes: (Note & { updatedAt: string })[];
};

export function HomeRecentNotes({ notes }: HomeRecentNotesProps) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Recent</h1>
        <NewNoteButton />
      </div>
      <ul className="mt-6 flex flex-col gap-0.5">
        {notes.map((note) => (
          <li key={note.id}>
            <Link
              to={`/notes/${note.id}`}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              <FileText className="size-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
              <span className="flex-1 truncate font-medium">{note.title}</span>
              {note.isFavorite && (
                <Star
                  aria-label="Favorite"
                  className="size-3.5 shrink-0 text-neutral-500"
                />
              )}
              <span className="shrink-0 text-xs text-neutral-600 dark:text-neutral-400">
                Edited {formatRelativeTime(note.updatedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
