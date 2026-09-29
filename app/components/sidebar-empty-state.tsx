import { useFetcher } from "react-router";

type SidebarEmptyStateProps = {
  message: string;
  action?: { path: string; label: string };
};

export function SidebarEmptyState({ message, action }: SidebarEmptyStateProps) {
  const fetcher = useFetcher();

  return (
    <div className="px-1.5 py-1 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
      {message}
      {action && (
        <fetcher.Form method="post" action={action.path}>
          <button
            type="submit"
            disabled={fetcher.state !== "idle"}
            className="font-medium text-neutral-900 underline underline-offset-2 disabled:opacity-50 dark:text-neutral-100"
          >
            {action.label}
          </button>
        </fetcher.Form>
      )}
    </div>
  );
}
