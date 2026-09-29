import type { LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";

type SidebarRenameInputProps = {
  icon: LucideIcon;
  emoji?: string;
  label: string;
  defaultValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export function SidebarRenameInput({
  icon: Icon,
  emoji,
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
    <div className="flex items-center gap-2 rounded-md bg-neutral-200/70 px-1.5 py-1 text-sm text-neutral-900 ring-1 ring-neutral-300 ring-inset focus-within:ring-neutral-400 pointer-coarse:py-2 dark:bg-neutral-800 dark:text-neutral-100 dark:ring-neutral-700 dark:focus-within:ring-neutral-600">
      {emoji ? (
        <span aria-hidden className="flex size-4 shrink-0 items-center justify-center leading-none">
          {emoji}
        </span>
      ) : (
        <Icon className="size-4 shrink-0" />
      )}
      <input
        ref={inputRef}
        aria-label={label}
        defaultValue={defaultValue}
        spellCheck={false}
        autoComplete="off"
        onBlur={() => finish(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") finish(true);
          if (event.key === "Escape") finish(false);
        }}
        className="h-5 min-w-0 flex-1 bg-transparent p-0 leading-5 outline-none selection:bg-neutral-300 dark:selection:bg-neutral-600"
      />
    </div>
  );
}
