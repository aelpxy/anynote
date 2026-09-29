import { FolderPlus } from "lucide-react";
import { useFetcher } from "react-router";

export function NewCollectionButton() {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action="/collections">
      <button
        type="submit"
        disabled={fetcher.state !== "idle"}
        className="flex h-9 items-center gap-1.5 rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        <FolderPlus className="size-4" />
        New collection
      </button>
    </fetcher.Form>
  );
}
