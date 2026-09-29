import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";

import { ConfirmDialog } from "~/components/confirm-dialog";

type EmptyTrashButtonProps = {
  count: number;
};

export function EmptyTrashButton({ count }: EmptyTrashButtonProps) {
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
      >
        <Trash2 className="size-4" />
        Empty trash
      </button>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Empty trash?"
        description={`${count} ${count === 1 ? "note is" : "notes are"} deleted forever.`}
        confirmLabel="Empty trash"
        onConfirm={() => fetcher.submit({ intent: "empty" }, { method: "post" })}
      />
    </>
  );
}
