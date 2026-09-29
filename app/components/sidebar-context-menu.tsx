import { ContextMenu } from "@base-ui/react/context-menu";

import { MenuPopup } from "~/components/menu-popup";

type SidebarContextMenuProps = {
  menu: React.ReactNode;
  children: React.ReactNode;
};

export function SidebarContextMenu({ menu, children }: SidebarContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className="rounded-md data-popup-open:bg-neutral-200/60 dark:data-popup-open:bg-neutral-800/60">
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-50">
          <MenuPopup>{menu}</MenuPopup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
