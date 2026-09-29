import { Minimize2 } from "lucide-react";

import { OfflineIndicator } from "~/components/offline-indicator";
import { useLayout } from "~/hooks/use-layout";
import { toggleFocusMode } from "~/lib/ui/layout-store";

type PageHeaderProps = {
  leading?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({ leading, actions }: PageHeaderProps) {
  const { isSidebarOpen, isFocusMode } = useLayout();

  return (
    <header
      className={[
        "sticky top-0 z-5 flex h-14 items-center gap-1 bg-white px-4 transition-opacity duration-200 print:hidden dark:bg-neutral-950",
        // in focus mode the header only shows while the pointer or focus is on it
        isFocusMode ? "opacity-0 focus-within:opacity-100 hover:opacity-100" : "",
      ].join(" ")}
    >
      <div
        className={[
          "flex min-w-0 flex-1 items-center",
          isSidebarOpen || isFocusMode ? "" : "pl-8",
        ].join(" ")}
      >
        {leading}
      </div>
      <OfflineIndicator />
      {actions}
      {isFocusMode && (
        <button
          type="button"
          onClick={toggleFocusMode}
          aria-label="Exit focus mode"
          className="rounded-md p-1.5 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
        >
          <Minimize2 className="size-4" />
        </button>
      )}
    </header>
  );
}
