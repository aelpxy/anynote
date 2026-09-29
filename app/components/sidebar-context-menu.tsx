import { ContextMenu } from "@base-ui/react/context-menu";
import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal } from "lucide-react";

import { MenuPopup } from "~/components/menu-popup";

type SidebarContextMenuProps = {
  menu: React.ReactNode;
  label: string;
  // collection rows keep their chevron at the end, so the button sits just before it
  buttonPosition?: "end" | "before-chevron";
  children: React.ReactNode;
};

export function SidebarContextMenu({
  menu,
  label,
  buttonPosition = "end",
  children,
}: SidebarContextMenuProps) {
  return (
    <div className="group/row relative">
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
      <Menu.Root>
        <Menu.Trigger
          aria-label={`${label} options`}
          className={[
            "absolute top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-neutral-600 opacity-0 transition-[opacity,background-color] group-hover/row:opacity-100 hover:bg-neutral-300/70 hover:text-neutral-900 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
            buttonPosition === "end" ? "right-1" : "right-6",
          ].join(" ")}
        >
          <MoreHorizontal className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="start" sideOffset={4} className="z-50">
            <MenuPopup>{menu}</MenuPopup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
