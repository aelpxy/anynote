import { Popover } from "@base-ui/react/popover";
import { SmilePlus } from "lucide-react";

import { noteIcons } from "~/lib/ui/note-icons";

type NoteIconPickerProps = {
  icon?: string;
  onChange: (icon: string) => void;
};

export function NoteIconPicker({ icon, onChange }: NoteIconPickerProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={icon ? "Change icon" : "Add icon"}
        className={
          icon
            ? "-ml-1 rounded-lg px-1 text-5xl leading-tight transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
            : "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-neutral-500 opacity-0 transition-[opacity,background-color] group-hover/title:opacity-100 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:opacity-100 data-popup-open:opacity-100 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
        }
      >
        {icon ?? (
          <>
            <SmilePlus className="size-4" />
            Add icon
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50">
          <Popover.Popup className="w-72 origin-(--transform-origin) rounded-lg border border-neutral-200 bg-white p-2 shadow-lg shadow-neutral-900/10 transition-[opacity,scale] duration-150 ease-out outline-none motion-reduce:transition-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40">
            <div className="grid grid-cols-8 gap-0.5">
              {noteIcons.map((option) => (
                <Popover.Close
                  key={option}
                  onClick={() => onChange(option)}
                  aria-label={option}
                  className={[
                    "flex size-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700",
                    option === icon ? "bg-neutral-100 dark:bg-neutral-700" : "",
                  ].join(" ")}
                >
                  {option}
                </Popover.Close>
              ))}
            </div>
            {icon && (
              <Popover.Close
                onClick={() => onChange("")}
                className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Remove icon
              </Popover.Close>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
