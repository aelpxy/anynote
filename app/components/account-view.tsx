import { KeyRound, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { AccountDeviceActions } from "~/components/account-device-actions";
import { ChangePasswordDialog } from "~/components/change-password-dialog";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { EmergencyKitPrint } from "~/components/emergency-kit-print";
import { SecondaryButton } from "~/components/secondary-button";
import { SecretKeyReveal } from "~/components/secret-key-reveal";
import { SessionsList } from "~/components/sessions-list";
import { SettingsSection } from "~/components/settings-section";
import { useAccount } from "~/hooks/use-account";
import { deleteAccount } from "~/lib/account/account-settings";
import { getRememberedDevice } from "~/lib/account/device";
import { printDocument } from "~/lib/print";
import { setOpenDialog } from "~/lib/ui/dialog-store";

export function AccountView() {
  const navigate = useNavigate();
  const account = useAccount();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  if (!account) return null;

  const { username } = account.user;
  const device = getRememberedDevice();
  const secretKey = device?.username === username ? device.secretKey : null;

  return (
    <>
      <SettingsSection title="Username">
        <p className="text-sm">{username}</p>
      </SettingsSection>

      <SettingsSection title="Secret Key">
        {secretKey ? (
          <div className="flex flex-col gap-3">
            <SecretKeyReveal secretKey={secretKey} />
            <SecondaryButton
              className="self-start"
              onClick={() => printDocument(`Anynote Emergency Kit - ${username}`)}
            >
              <Printer className="size-4" />
              Save Emergency Kit
            </SecondaryButton>
            <EmergencyKitPrint username={username} secretKey={secretKey} />
          </div>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Not saved on this device.</p>
        )}
      </SettingsSection>

      <SettingsSection title="Password">
        <SecondaryButton className="self-start" onClick={() => setIsPasswordOpen(true)}>
          <KeyRound className="size-4" />
          Change password
        </SecondaryButton>
      </SettingsSection>

      <SettingsSection title="Sessions">
        <SessionsList />
      </SettingsSection>

      <SettingsSection title="This device">
        <AccountDeviceActions />
      </SettingsSection>

      <SettingsSection title="Delete account">
        <SecondaryButton className="self-start" onClick={() => setIsDeleteOpen(true)}>
          <Trash2 className="size-4" />
          Delete account
        </SecondaryButton>
      </SettingsSection>

      <ChangePasswordDialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen} />
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete account?"
        description="All your workspaces and notes are deleted. This can't be undone."
        confirmLabel="Delete account"
        requirePassword
        onConfirm={async (password) => {
          await deleteAccount(account, password);
          setOpenDialog(null);
          navigate("/signup", { replace: true });
        }}
      />
    </>
  );
}
