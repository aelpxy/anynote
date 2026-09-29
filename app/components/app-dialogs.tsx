import { useNavigate, useRevalidator } from "react-router";

import { AccountView } from "~/components/account-view";
import { CreateWorkspaceForm } from "~/components/create-workspace-form";
import { KeyboardShortcutsView } from "~/components/keyboard-shortcuts-view";
import { Modal } from "~/components/modal";
import { SettingsView } from "~/components/settings-view";
import { useAppDialog } from "~/hooks/use-app-dialog";
import { setCurrentWorkspace } from "~/lib/account/session-store";
import { setOpenDialog } from "~/lib/ui/dialog-store";

export function AppDialogs() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const openDialog = useAppDialog();

  function onOpenChange(open: boolean) {
    if (!open) setOpenDialog(null);
  }

  return (
    <>
      <Modal open={openDialog === "account"} onOpenChange={onOpenChange} title="Account" size="lg">
        <AccountView />
      </Modal>
      <Modal open={openDialog === "settings"} onOpenChange={onOpenChange} title="Settings" size="lg">
        <SettingsView />
      </Modal>
      <Modal open={openDialog === "create-workspace"} onOpenChange={onOpenChange} title="New workspace">
        <CreateWorkspaceForm
          autoFocus
          onCancel={() => setOpenDialog(null)}
          onCreated={(workspace) => {
            setOpenDialog(null);
            setCurrentWorkspace(workspace.id);
            navigate("/");
            void revalidator.revalidate();
          }}
        />
      </Modal>
      <Modal open={openDialog === "shortcuts"} onOpenChange={onOpenChange} title="Keyboard shortcuts" size="md">
        <KeyboardShortcutsView />
      </Modal>
    </>
  );
}
