import { Menu } from "@base-ui/react/menu";
import type { LucideIcon } from "lucide-react";

type MenuItemProps = {
  icon: LucideIcon;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

export function MenuItem({
  icon: Icon,
  children,
  disabled,
  onClick,
}: MenuItemProps) {
  return (
    <Menu.Item
      onClick={onClick}
      disabled={disabled}
      className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 outline-none select-none data-disabled:opacity-50 data-highlighted:bg-neutral-100 data-highlighted:text-neutral-900 dark:text-neutral-300 dark:data-highlighted:bg-neutral-700 dark:data-highlighted:text-neutral-100"
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </Menu.Item>
  );
}
