import { Menu } from "@base-ui/react/menu";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { MenuPopup } from "~/components/menu-popup";

type MenuSubmenuProps = {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
};

export function MenuSubmenu({ icon: Icon, label, children }: MenuSubmenuProps) {
  return (
    <Menu.SubmenuRoot>
      <Menu.SubmenuTrigger className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 outline-none select-none data-highlighted:bg-neutral-100 data-highlighted:text-neutral-900 data-popup-open:bg-neutral-100 dark:text-neutral-300 dark:data-highlighted:bg-neutral-700 dark:data-highlighted:text-neutral-100 dark:data-popup-open:bg-neutral-700">
        <Icon className="size-4 shrink-0" />
        <span className="flex-1">{label}</span>
        <ChevronRight className="size-3.5 shrink-0" />
      </Menu.SubmenuTrigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} alignOffset={-4} className="z-50">
          <MenuPopup>{children}</MenuPopup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.SubmenuRoot>
  );
}
