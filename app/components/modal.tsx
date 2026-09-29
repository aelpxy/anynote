import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import {
  dialogBackdropClass,
  dialogDescriptionClass,
  dialogPopupClass,
  dialogTitleClass,
  type DialogSize,
} from "~/lib/ui/dialog-classes";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: DialogSize;
  children: React.ReactNode;
};

export function Modal({ open, onOpenChange, title, description, size = "sm", children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogBackdropClass} />
        <Dialog.Popup className={dialogPopupClass(size)}>
          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            <div className="min-w-0">
              <Dialog.Title className={dialogTitleClass}>{title}</Dialog.Title>
              {description && (
                <Dialog.Description className={dialogDescriptionClass}>{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="-mt-1 -mr-1.5 rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 pt-5 pb-5">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
