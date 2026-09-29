import { Menu } from "@base-ui/react/menu";
import { FileDown, FileText, Printer } from "lucide-react";

import { MenuItem } from "~/components/menu-item";
import { MenuPopup } from "~/components/menu-popup";
import { downloadFile, toFileName } from "~/lib/download";
import { printDocument } from "~/lib/print";

type ExportMenuProps = {
  title: string;
  getMarkdown: () => string;
};

export function ExportMenu({ title, getMarkdown }: ExportMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Export" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-popup-open:bg-neutral-100 data-popup-open:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 dark:data-popup-open:bg-neutral-900 dark:data-popup-open:text-neutral-100">
        <FileDown className="size-4" />
        <span className="hidden sm:inline">Export</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className="z-50">
          <MenuPopup>
            <MenuItem
              icon={FileText}
              onClick={() =>
                downloadFile(
                  toFileName(title, "md"),
                  getMarkdown(),
                  "text/markdown;charset=utf-8",
                )
              }
            >
              Markdown (.md)
            </MenuItem>
            <MenuItem icon={Printer} onClick={() => printDocument()}>
              PDF (print)
            </MenuItem>
          </MenuPopup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
