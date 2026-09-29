import type { LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";

type SidebarRenameInputProps = {
  icon: LucideIcon;
  label: string;
  defaultValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export function SidebarRenameInput({
  icon: Icon,
  label,
  defaultValue,
  onSubmit,
  onCancel,
}: SidebarRenameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDoneRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function finish(shouldSave: boolean) {
    if (isDoneRef.current) return;
    isDoneRef.current = true;

    const value = inputRef.current?.value.trim() ?? "";
    if (shouldSave && value && value !== defaultValue) {
      onSubmit(value);
    } else {
      onCancel();
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-white px-1.5 py-1 ring-1 ring-neutral-300 dark:bg-neutral-950 dark:ring-neutral-700">
      <Icon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-300" />
      <input
        ref={inputRef}
        aria-label={label}
        defaultValue={defaultValue}
        onBlur={() => finish(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") finish(true);
          if (event.key === "Escape") finish(false);
        }}
        className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none dark:text-neutral-100"
      />
    </div>
  );
}
