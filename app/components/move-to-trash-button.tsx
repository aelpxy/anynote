import { Trash2 } from "lucide-react";
import { Form } from "react-router";

import { toastTrashed } from "~/lib/ui/undo-toasts";

type MoveToTrashButtonProps = {
  noteId: string;
};

export function MoveToTrashButton({ noteId }: MoveToTrashButtonProps) {
  return (
    <Form method="post" onSubmit={() => toastTrashed([noteId])}>
      <input type="hidden" name="redirect" value="home" />
      <button
        type="submit"
        name="intent"
        value="trash"
        aria-label="Move to trash"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
      >
        <Trash2 className="size-4" />
        <span className="hidden sm:inline">Move to trash</span>
      </button>
    </Form>
  );
}
