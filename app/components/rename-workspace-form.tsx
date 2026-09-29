import { useState } from "react";

import { FormError } from "~/components/form-error";
import { SecondaryButton } from "~/components/secondary-button";
import { TextField } from "~/components/text-field";
import { getErrorMessage } from "~/lib/account/error-message";
import type { UnlockedAccount, UnlockedWorkspace } from "~/lib/account/unlocked-account";
import { renameWorkspace } from "~/lib/account/workspaces";

type RenameWorkspaceFormProps = {
  account: UnlockedAccount;
  workspace: UnlockedWorkspace;
};

export function RenameWorkspaceForm({ account, workspace }: RenameWorkspaceFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const canEdit = workspace.role !== "viewer";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name) return setError("Enter a name.");
    if (name === workspace.name) return;

    setError(null);
    setStatus("saving");
    try {
      await renameWorkspace(account, workspace, name);
      setStatus("saved");
    } catch (caught) {
      setError(getErrorMessage(caught));
      setStatus("idle");
    }
  }

  return (
    <form key={workspace.id} onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Name"
            name="name"
            defaultValue={workspace.name}
            maxLength={80}
            disabled={!canEdit || status === "saving"}
            onChange={() => setStatus("idle")}
          />
        </div>
        <SecondaryButton type="submit" disabled={!canEdit || status === "saving"}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Rename"}
        </SecondaryButton>
      </div>
      <FormError message={error} />
    </form>
  );
}
