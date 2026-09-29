import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

type SidebarToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
  const Icon = isOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={isOpen}
      className="rounded-md p-1 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      <Icon className="size-4" />
    </button>
  );
}
