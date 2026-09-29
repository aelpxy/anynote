import { Lock, LogOut } from "lucide-react";
import { useNavigate } from "react-router";

import { SecondaryButton } from "~/components/secondary-button";
import { lockAccount, signOut } from "~/lib/account/session";
import { setOpenDialog } from "~/lib/ui/dialog-store";

export function AccountDeviceActions() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2">
      <SecondaryButton
        onClick={async () => {
          setOpenDialog(null);
          await lockAccount();
          navigate("/unlock");
        }}
      >
        <Lock className="size-4" />
        Lock
      </SecondaryButton>
      <SecondaryButton
        onClick={async () => {
          setOpenDialog(null);
          await signOut();
          navigate("/signin");
        }}
      >
        <LogOut className="size-4" />
        Log out
      </SecondaryButton>
    </div>
  );
}
