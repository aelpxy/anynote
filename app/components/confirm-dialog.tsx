import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useState } from "react";

import { FormError } from "~/components/form-error";
import { PrimaryButton } from "~/components/primary-button";
import { SecondaryButton } from "~/components/secondary-button";
import { TextField } from "~/components/text-field";
import { getErrorMessage } from "~/lib/account/error-message";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  requirePassword?: boolean;
  onConfirm: (password: string) => Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  requirePassword,
  onConfirm,
}: ConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      await onConfirm(String(new FormData(event.currentTarget).get("password") ?? ""));
      onOpenChange(false);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-150 ease-out motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-black/50" />
        <AlertDialog.Popup className="fixed top-[20vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-neutral-200 bg-white p-5 shadow-xl shadow-neutral-900/10 transition-[opacity,scale] duration-150 ease-out motion-reduce:transition-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40">
          <AlertDialog.Title className="text-base font-semibold">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </AlertDialog.Description>
          )}
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3" noValidate>
            {requirePassword && (
              <TextField
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                disabled={isPending}
              />
            )}
            <FormError message={error} />
            <div className="flex gap-2">
              <AlertDialog.Close
                render={<SecondaryButton className="flex-1" disabled={isPending} />}
              >
                Cancel
              </AlertDialog.Close>
              <div className="flex-1">
                <PrimaryButton isPending={isPending} pendingLabel="Working…">
                  {confirmLabel}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
