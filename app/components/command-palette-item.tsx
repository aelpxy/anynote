import { Command } from "cmdk";
import type { LucideIcon } from "lucide-react";

type CommandPaletteItemProps = {
  value?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onSelect: () => void;
};

export function CommandPaletteItem({
  value,
  icon: Icon,
  children,
  onSelect,
}: CommandPaletteItemProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 select-none data-[selected=true]:bg-neutral-100 data-[selected=true]:text-neutral-900 dark:text-neutral-300 dark:data-[selected=true]:bg-neutral-800 dark:data-[selected=true]:text-neutral-100"
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </Command.Item>
  );
}
