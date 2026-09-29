import { useState } from "react";

import { FormError } from "~/components/form-error";
import { PrimaryButton } from "~/components/primary-button";
import { TextField } from "~/components/text-field";
import { getErrorMessage } from "~/lib/account/error-message";
import { signUp } from "~/lib/account/sign-up";
import type { UnlockedAccount } from "~/lib/account/unlocked-account";
import { isValidUsername, normalizeUsername } from "~/lib/account/username";

const minPasswordLength = 10;

type SignUpFormProps = {
  onSignedUp: (result: { account: UnlockedAccount; secretKey: string }) => void;
};

export function SignUpForm({ onSignedUp }: SignUpFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = normalizeUsername(String(form.get("username")));
    const password = String(form.get("password"));

    if (!isValidUsername(username)) {
      return setError("3–32 characters: a–z, 0–9 and _.");
    }
    if (password.length < minPasswordLength) {
      return setError(`At least ${minPasswordLength} characters.`);
    }
    if (password !== form.get("confirmPassword")) {
      return setError("Passwords don't match.");
    }

    setError(null);
    setIsPending(true);
    try {
      onSignedUp(await signUp(username, password));
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
        autoComplete="new-password"
        required
        disabled={isPending}
        hint="Can't be reset."
      />
      <TextField
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        disabled={isPending}
      />
      <FormError message={error} />
      <PrimaryButton isPending={isPending} pendingLabel="Creating account…">
        Create account
      </PrimaryButton>
    </form>
  );
}
