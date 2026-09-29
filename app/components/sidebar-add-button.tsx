import { Plus } from "lucide-react";
import { useFetcher } from "react-router";

type SidebarAddButtonProps = {
  action: string;
  label: string;
};

export function SidebarAddButton({ action, label }: SidebarAddButtonProps) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action={action}>
      <button
        type="submit"
        aria-label={label}
        disabled={fetcher.state !== "idle"}
        className="rounded-md p-1 text-neutral-600 opacity-0 transition-[opacity,color,background-color] duration-150 group-hover/section:opacity-100 hover:bg-neutral-200/60 hover:text-neutral-900 focus-visible:opacity-100 disabled:opacity-50 motion-reduce:transition-none dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
      >
        <Plus className="size-3.5" />
      </button>
    </fetcher.Form>
  );
}
