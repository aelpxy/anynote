import { useState } from "react";

import { FormError } from "~/components/form-error";
import { PrimaryButton } from "~/components/primary-button";
import { TextField } from "~/components/text-field";
import { useAccount } from "~/hooks/use-account";
import { getErrorMessage } from "~/lib/account/error-message";
import type { UnlockedWorkspace } from "~/lib/account/unlocked-account";
import { createWorkspace } from "~/lib/account/workspaces";

type CreateWorkspaceFormProps = {
  onCreated: (workspace: UnlockedWorkspace) => void;
};

export function CreateWorkspaceForm({ onCreated }: CreateWorkspaceFormProps) {
  const account = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name")).trim();
    if (!account) return;
    if (!name) return setError("Enter a name.");

    setError(null);
    setIsPending(true);
    try {
      const workspace = await createWorkspace(account, name);
      form.reset();
      onCreated(workspace);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <TextField
        label="Name"
        name="name"
        autoComplete="off"
        maxLength={80}
        required
        disabled={isPending}
      />
      <FormError message={error} />
      <PrimaryButton isPending={isPending} pendingLabel="Creating…">
        Create workspace
      </PrimaryButton>
    </form>
  );
}
