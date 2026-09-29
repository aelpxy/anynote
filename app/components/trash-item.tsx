import { FileText, RotateCcw, Trash2 } from "lucide-react";
import { useFetcher } from "react-router";

import type { Note } from "~/lib/vault/types";

type TrashItemProps = {
  note: Note;
};

export function TrashItem({ note }: TrashItemProps) {
  const fetcher = useFetcher();

  return (
    <li className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900">
      <FileText className="size-4 shrink-0" />
      <span className="flex-1 truncate">{note.title}</span>
      <fetcher.Form method="post" className="flex items-center gap-1">
        <input type="hidden" name="noteId" value={note.id} />
        <button
          type="submit"
          name="intent"
          value="restore"
          aria-label={`Restore ${note.title}`}
          disabled={fetcher.state !== "idle"}
          className="rounded-md p-1 transition-colors hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <RotateCcw className="size-4" />
        </button>
        <button
          type="submit"
          name="intent"
          value="delete"
          aria-label={`Delete ${note.title} forever`}
          disabled={fetcher.state !== "idle"}
          className="rounded-md p-1 transition-colors hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <Trash2 className="size-4" />
        </button>
      </fetcher.Form>
    </li>
  );
}
