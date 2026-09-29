import type { LucideIcon } from "lucide-react";
import { Link, useMatch } from "react-router";

type SidebarLinkProps = {
  to: string;
  icon: LucideIcon;
  state?: unknown;
  isSelected?: boolean;
  onDragStart?: React.DragEventHandler<HTMLAnchorElement>;
  onDragEnd?: React.DragEventHandler<HTMLAnchorElement>;
  children: React.ReactNode;
};

export function SidebarLink({
  to,
  icon: Icon,
  state,
  isSelected,
  onDragStart,
  onDragEnd,
  children,
}: SidebarLinkProps) {
  const isRouteActive = useMatch(to) !== null;
  const isActive = isSelected ?? isRouteActive;

  return (
    <Link
      to={to}
      state={state}
      aria-current={isActive ? "page" : undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        "flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors",
        isActive
          ? "bg-neutral-200 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
          : "text-neutral-700 hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100",
      ].join(" ")}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </Link>
  );
}
