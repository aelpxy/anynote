import type { LucideIcon } from "lucide-react";

type EditorToolbarButtonProps = {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function EditorToolbarButton({
  icon: Icon,
  label,
  isActive,
  disabled,
  onClick,
}: EditorToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isActive}
      disabled={disabled}
      // keep focus and selection in the editor
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="rounded-md p-1.5 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-neutral-100 aria-pressed:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:aria-pressed:bg-neutral-700 dark:aria-pressed:text-neutral-100"
    >
      <Icon className="size-4" />
    </button>
  );
}
