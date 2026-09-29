import { Menu } from "@base-ui/react/menu";
import { Box, CircleUser, Lock, LogOut, Plus, Settings, User } from "lucide-react";
import { useNavigate, useRevalidator } from "react-router";

import { MenuItem } from "~/components/menu-item";
import { MenuPopup } from "~/components/menu-popup";
import { MenuRadioItem } from "~/components/menu-radio-item";
import { MenuSeparator } from "~/components/menu-separator";
import { ThemeSubmenu } from "~/components/theme-submenu";
import { useAccount } from "~/hooks/use-account";
import { useCurrentWorkspaceId } from "~/hooks/use-current-workspace-id";
import { lockAccount, signOut } from "~/lib/account/session";
import { setCurrentWorkspace } from "~/lib/account/session-store";
import { setOpenDialog } from "~/lib/ui/dialog-store";

export function WorkspaceMenu() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const account = useAccount();
  const currentWorkspaceId = useCurrentWorkspaceId();
  const workspaces = account?.workspaces ?? [];
  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === currentWorkspaceId) ?? workspaces[0];

  function handleWorkspaceChange(workspaceId: string) {
    if (workspaceId === currentWorkspace?.id) return;
    setCurrentWorkspace(workspaceId);
    navigate("/");
    void revalidator.revalidate();
  }

  async function handleLock() {
    await lockAccount();
    navigate("/unlock");
  }

  async function handleSignOut() {
    await signOut();
    navigate("/signin");
  }

  return (
    <Menu.Root>
      <Menu.Trigger className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm text-neutral-900 transition-colors hover:bg-neutral-200/60 data-popup-open:bg-neutral-200/60 dark:text-neutral-100 dark:hover:bg-neutral-800/60 dark:data-popup-open:bg-neutral-800/60">
        <Box className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left font-medium">
          {currentWorkspace?.name}
        </span>
        <CircleUser className="size-4 shrink-0 text-neutral-700 dark:text-neutral-300" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="start" className="z-50">
          <MenuPopup>
            <Menu.Group>
              <Menu.GroupLabel className="px-2 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Workspaces
              </Menu.GroupLabel>
              <Menu.RadioGroup
                value={currentWorkspace?.id}
                onValueChange={handleWorkspaceChange}
              >
                {workspaces.map((workspace) => (
                  <MenuRadioItem
                    key={workspace.id}
                    value={workspace.id}
                    icon={Box}
                    closeOnClick
                  >
                    {workspace.name}
                  </MenuRadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>
            <MenuSeparator />
            <MenuItem icon={Plus} onClick={() => setOpenDialog("create-workspace")}>
              Create workspace
            </MenuItem>
            <MenuSeparator />
            <Menu.Group>
              <Menu.GroupLabel className="truncate px-2 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Signed in as {account?.user.username}
              </Menu.GroupLabel>
              <MenuItem icon={User} onClick={() => setOpenDialog("account")}>
                My account
              </MenuItem>
              <MenuItem icon={Settings} onClick={() => setOpenDialog("settings")}>
                Settings
              </MenuItem>
              <ThemeSubmenu />
            </Menu.Group>
            <MenuSeparator />
            <MenuItem icon={Lock} onClick={handleLock}>
              Lock
            </MenuItem>
            <MenuItem icon={LogOut} onClick={handleSignOut}>
              Log out
            </MenuItem>
          </MenuPopup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
