type SidebarDropIndicatorProps = {
  side: "before" | "after";
};

export function SidebarDropIndicator({ side }: SidebarDropIndicatorProps) {
  return (
    <span
      aria-hidden
      className={[
        "pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-neutral-500 dark:bg-neutral-400",
        side === "before" ? "top-0" : "bottom-0",
      ].join(" ")}
    />
  );
}
