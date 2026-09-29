import { useState } from "react";

import { FormError } from "~/components/form-error";
import { Modal } from "~/components/modal";
import { PrimaryButton } from "~/components/primary-button";
import { TextField } from "~/components/text-field";
import { useAccount } from "~/hooks/use-account";
import { changePassword } from "~/lib/account/account-settings";
import { getErrorMessage } from "~/lib/account/error-message";
import { InvalidCredentialsError } from "~/lib/account/sign-in";

const minPasswordLength = 10;

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const account = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword"));
    if (!account) return;
    if (newPassword.length < minPasswordLength) {
      return setError(`At least ${minPasswordLength} characters.`);
    }
    if (newPassword !== form.get("confirmPassword")) return setError("Passwords don't match.");

    setError(null);
    setIsPending(true);
    try {
      await changePassword(account, String(form.get("currentPassword")), newPassword);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof InvalidCredentialsError ? "Wrong password." : getErrorMessage(caught));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
        if (!next) setError(null);
      }}
      title="Change password"
      description="Other sessions will be signed out."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <TextField
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          disabled={isPending}
        />
        <TextField
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
        />
        <TextField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
        />
        <FormError message={error} />
        <PrimaryButton isPending={isPending} pendingLabel="Changing…">
          Change password
        </PrimaryButton>
      </form>
    </Modal>
  );
}
