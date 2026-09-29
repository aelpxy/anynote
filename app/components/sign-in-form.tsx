import { useState } from "react";
import { useNavigate } from "react-router";

import { FormError } from "~/components/form-error";
import { PrimaryButton } from "~/components/primary-button";
import { TextField } from "~/components/text-field";
import { type RememberedDevice, rememberDevice } from "~/lib/account/device";
import { getErrorMessage } from "~/lib/account/error-message";
import { setAccount } from "~/lib/account/session-store";
import { signIn } from "~/lib/account/sign-in";
import { isValidUsername, normalizeUsername } from "~/lib/account/username";
import { parseSecretKey } from "~/lib/crypto/secret-key";

type SignInFormProps = {
  device: RememberedDevice | null;
  redirectTo: string;
};

export function SignInForm({ device, redirectTo }: SignInFormProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [useSavedKey, setUseSavedKey] = useState(Boolean(device));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = normalizeUsername(String(form.get("username")));
    const secretKey =
      useSavedKey && device ? device.secretKey : parseSecretKey(String(form.get("secretKey")));

    if (!isValidUsername(username)) return setError("Enter your username.");
    if (!secretKey) return setError("Invalid Secret Key.");

    setError(null);
    setIsPending(true);
    try {
      const account = await signIn(username, String(form.get("password")), secretKey);
      rememberDevice({ username, secretKey });
      setAccount(account);
      navigate(redirectTo, { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught));
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Username"
        name="username"
        defaultValue={device?.username}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        disabled={isPending}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus={Boolean(device)}
        required
        disabled={isPending}
      />
      {useSavedKey ? (
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Secret Key saved on this device ·{" "}
          <button
            type="button"
            onClick={() => setUseSavedKey(false)}
            className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
          >
            Change
          </button>
        </p>
      ) : (
        <TextField
          label="Secret Key"
          name="secretKey"
          placeholder="A1-XXXXX-XXXXX-XXXXX-XXXXX-XXXXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          disabled={isPending}
          className="font-mono"
          hint="From your Emergency Kit."
        />
      )}
      <FormError message={error} />
      <PrimaryButton isPending={isPending} pendingLabel="Unlocking…">
        Sign in
      </PrimaryButton>
    </form>
  );
}
