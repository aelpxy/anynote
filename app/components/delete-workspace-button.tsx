import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";

import { ConfirmDialog } from "~/components/confirm-dialog";
import { SecondaryButton } from "~/components/secondary-button";
import type { UnlockedAccount, UnlockedWorkspace } from "~/lib/account/unlocked-account";
import { deleteWorkspace } from "~/lib/account/workspaces";
import { setOpenDialog } from "~/lib/ui/dialog-store";

type DeleteWorkspaceButtonProps = {
  account: UnlockedAccount;
  workspace: UnlockedWorkspace;
};

export function DeleteWorkspaceButton({ account, workspace }: DeleteWorkspaceButtonProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [isOpen, setIsOpen] = useState(false);
  const isOnlyWorkspace = account.workspaces.length <= 1;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <SecondaryButton
          onClick={() => setIsOpen(true)}
          className="self-start"
          disabled={isOnlyWorkspace || workspace.role !== "owner"}
        >
          <Trash2 className="size-4" />
          Delete workspace
        </SecondaryButton>
        {isOnlyWorkspace && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            You can't delete your only workspace.
          </p>
        )}
      </div>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={`Delete ${workspace.name}?`}
        description="All its notes are deleted. This can't be undone."
        confirmLabel="Delete workspace"
        onConfirm={async () => {
          await deleteWorkspace(account, workspace.id);
          setOpenDialog(null);
          navigate("/");
          await revalidator.revalidate();
        }}
      />
    </>
  );
}
