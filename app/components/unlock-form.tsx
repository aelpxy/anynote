import { useState } from "react";
import { useNavigate } from "react-router";

import { FormError } from "~/components/form-error";
import { PrimaryButton } from "~/components/primary-button";
import { TextField } from "~/components/text-field";
import type { RememberedDevice } from "~/lib/account/device";
import { getErrorMessage } from "~/lib/account/error-message";
import { setAccount } from "~/lib/account/session-store";
import { InvalidCredentialsError, signIn } from "~/lib/account/sign-in";

type UnlockFormProps = {
  device: RememberedDevice;
  redirectTo: string;
};

export function UnlockForm({ device, redirectTo }: UnlockFormProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password"));

    setError(null);
    setIsPending(true);
    try {
      setAccount(await signIn(device.username, password, device.secretKey));
      navigate(redirectTo, { replace: true });
    } catch (caught) {
      setError(caught instanceof InvalidCredentialsError ? "Wrong password." : getErrorMessage(caught));
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="username" autoComplete="username" value={device.username} />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        disabled={isPending}
      />
      <FormError message={error} />
      <PrimaryButton isPending={isPending} pendingLabel="Unlocking…">
        Unlock
      </PrimaryButton>
    </form>
  );
}
