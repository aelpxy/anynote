import { Dialog } from "@base-ui/react/dialog";

import { CommandPaletteContent } from "~/components/command-palette-content";
import { dialogBackdropClass } from "~/lib/ui/dialog-classes";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogBackdropClass} />
        <Dialog.Popup className="fixed top-[20vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 transition-[opacity,scale] duration-150 ease-out motion-reduce:transition-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/50">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <CommandPaletteContent onClose={() => onOpenChange(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
