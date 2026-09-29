import { Box, Check } from "lucide-react";
import { useNavigate, useRevalidator } from "react-router";

import { CreateWorkspaceForm } from "~/components/create-workspace-form";
import { DeleteWorkspaceButton } from "~/components/delete-workspace-button";
import { NoteAppearanceSettings } from "~/components/note-appearance-settings";
import { RenameWorkspaceForm } from "~/components/rename-workspace-form";
import { SettingsSection } from "~/components/settings-section";
import { ThemeSelector } from "~/components/theme-selector";
import { useAccount } from "~/hooks/use-account";
import { useCurrentWorkspaceId } from "~/hooks/use-current-workspace-id";
import { setCurrentWorkspace } from "~/lib/account/session-store";
import { setOpenDialog } from "~/lib/ui/dialog-store";

export function SettingsView() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const account = useAccount();
  const currentWorkspaceId = useCurrentWorkspaceId();
  if (!account) return null;

  const currentWorkspace =
    account.workspaces.find(({ id }) => id === currentWorkspaceId) ?? account.workspaces[0];

  function openWorkspace(workspaceId: string) {
    setOpenDialog(null);
    setCurrentWorkspace(workspaceId);
    navigate("/");
    void revalidator.revalidate();
  }

  return (
    <>
      <div>
        <SettingsSection title="Appearance">
          <ThemeSelector />
        </SettingsSection>

        <SettingsSection title="Notes">
          <NoteAppearanceSettings />
        </SettingsSection>

        {currentWorkspace && (
          <SettingsSection title="Current workspace">
            <div className="flex flex-col gap-4">
              <RenameWorkspaceForm account={account} workspace={currentWorkspace} />
              <DeleteWorkspaceButton account={account} workspace={currentWorkspace} />
            </div>
          </SettingsSection>
        )}

        <SettingsSection id="workspaces" title="Workspaces">
          <ul className="mb-5 flex flex-col gap-0.5">
            {account.workspaces.map((workspace) => (
              <li key={workspace.id}>
                <button
                  type="button"
                  onClick={() => openWorkspace(workspace.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                >
                  <Box className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{workspace.name}</span>
                  <span className="text-xs text-neutral-600 capitalize dark:text-neutral-400">
                    {workspace.role}
                  </span>
                  {workspace.id === currentWorkspace?.id && (
                    <Check aria-label="Current workspace" className="size-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
          <CreateWorkspaceForm onCreated={(workspace) => openWorkspace(workspace.id)} />
        </SettingsSection>
      </div>
    </>
  );
}
