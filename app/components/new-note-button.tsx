import { FilePlus } from "lucide-react";
import { useFetcher } from "react-router";

export function NewNoteButton() {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action="/notes">
      <button
        type="submit"
        disabled={fetcher.state !== "idle"}
        className="flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        <FilePlus className="size-4" />
        New document
      </button>
    </fetcher.Form>
  );
}
