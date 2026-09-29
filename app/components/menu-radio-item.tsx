import { Menu } from "@base-ui/react/menu";
import { Check, type LucideIcon } from "lucide-react";

type MenuRadioItemProps = {
  value: string;
  icon: LucideIcon;
  closeOnClick?: boolean;
  children: React.ReactNode;
};

export function MenuRadioItem({
  value,
  icon: Icon,
  closeOnClick,
  children,
}: MenuRadioItemProps) {
  return (
    <Menu.RadioItem
      value={value}
      closeOnClick={closeOnClick}
      className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 outline-none select-none data-highlighted:bg-neutral-100 data-highlighted:text-neutral-900 dark:text-neutral-300 dark:data-highlighted:bg-neutral-700 dark:data-highlighted:text-neutral-100"
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{children}</span>
      <Menu.RadioItemIndicator>
        <Check className="size-4" />
      </Menu.RadioItemIndicator>
    </Menu.RadioItem>
  );
}
