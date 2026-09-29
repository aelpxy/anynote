import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useState } from "react";

import { DialogFooter } from "~/components/dialog-footer";
import { FormError } from "~/components/form-error";
import { PrimaryButton } from "~/components/primary-button";
import { SecondaryButton } from "~/components/secondary-button";
import { TextField } from "~/components/text-field";
import { getErrorMessage } from "~/lib/account/error-message";
import {
  dialogBackdropClass,
  dialogDescriptionClass,
  dialogPopupClass,
  dialogTitleClass,
} from "~/lib/ui/dialog-classes";

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
        <AlertDialog.Backdrop className={dialogBackdropClass} />
        <AlertDialog.Popup className={dialogPopupClass("sm")}>
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5" noValidate>
            <AlertDialog.Title className={dialogTitleClass}>{title}</AlertDialog.Title>
            {description && (
              <AlertDialog.Description className={dialogDescriptionClass}>
                {description}
              </AlertDialog.Description>
            )}
            {(requirePassword || error) && (
              <div className="mt-5 flex flex-col gap-3">
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
              </div>
            )}
            <DialogFooter>
              <AlertDialog.Close render={<SecondaryButton disabled={isPending} />}>
                Cancel
              </AlertDialog.Close>
              <PrimaryButton className="" isPending={isPending} pendingLabel="Working…">
                {confirmLabel}
              </PrimaryButton>
            </DialogFooter>
          </form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
