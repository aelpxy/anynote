import { Search } from "lucide-react";

type SidebarSearchButtonProps = {
  onClick: () => void;
};

export function SidebarSearchButton({ onClick }: SidebarSearchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm text-neutral-700 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 text-left">Search</span>
      <kbd className="font-sans text-xs text-neutral-600 dark:text-neutral-400">
        ⌘K
      </kbd>
    </button>
  );
}
