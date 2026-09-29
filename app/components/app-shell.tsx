import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

import { AppDialogs } from "~/components/app-dialogs";
import { CommandPalette } from "~/components/command-palette";
import { RouteAnnouncer } from "~/components/route-announcer";
import { Sidebar } from "~/components/sidebar";
import { SidebarToggle } from "~/components/sidebar-toggle";
import { Toaster } from "~/components/toaster";
import { useAppShortcuts } from "~/hooks/use-app-shortcuts";
import { useCrossTabLock } from "~/hooks/use-cross-tab-lock";
import { useHotkey } from "~/hooks/use-hotkey";
import { useIsMobile } from "~/hooks/use-is-mobile";
import { useLayout } from "~/hooks/use-layout";
import { usePreventFileNavigation } from "~/hooks/use-prevent-file-navigation";
import { useUnsyncedChangesWarning } from "~/hooks/use-unsynced-changes-warning";
import { useVaultSync } from "~/hooks/use-vault-sync";
import { setSidebarOpen, toggleSidebar } from "~/lib/ui/layout-store";
import type { Collection, Note } from "~/lib/vault/types";

type AppShellProps = {
  favorites: Note[];
  documents: Note[];
  collections: Collection[];
  children: React.ReactNode;
};

export function AppShell({
  favorites,
  documents,
  collections,
  children,
}: AppShellProps) {
  const layout = useLayout();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const isSidebarVisible = layout.isSidebarOpen && !layout.isFocusMode;

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, pathname]);

  const isDrawerOpen = isMobile && isSidebarVisible;

  useEffect(() => {
    if (!isDrawerOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  const sidebarProps = {
    favorites,
    documents,
    collections,
    onSearch: () => setIsCommandPaletteOpen(true),
  };

  useHotkey("k", () => setIsCommandPaletteOpen((isOpen) => !isOpen));
  useAppShortcuts(documents);
  useVaultSync();
  useCrossTabLock();
  usePreventFileNavigation();
  useUnsyncedChangesWarning();

  return (
    <div className="relative flex h-dvh print:block print:h-auto">
      <a
        href="#main"
        className="sr-only rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        Skip to content
      </a>
      {!layout.isFocusMode && (
        <div
          className={[
            "absolute top-4 left-4 print:hidden",
            isMobile ? "z-40" : "z-10",
          ].join(" ")}
        >
          <SidebarToggle isOpen={layout.isSidebarOpen} onToggle={toggleSidebar} />
        </div>
      )}
      {isMobile ? (
        <AnimatePresence>
          {isSidebarVisible && (
            <>
              <motion.div
                key="backdrop"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={toggleSidebar}
                className="fixed inset-0 z-30 bg-black/20 dark:bg-black/50"
              />
              <motion.div
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
                className="fixed inset-y-0 left-0 z-30 pr-2"
              >
                <Sidebar {...sidebarProps} width={288} isDrawer />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      ) : (
        <AnimatePresence initial={false}>
          {isSidebarVisible && (
            <Sidebar {...sidebarProps} width={layout.sidebarWidth} />
          )}
        </AnimatePresence>
      )}
      <main
        id="main"
        tabIndex={-1}
        inert={isDrawerOpen}
        className="flex-1 overflow-y-auto outline-none print:overflow-visible"
      >
        {children}
      </main>
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />
      <AppDialogs />
      <Toaster />
      <RouteAnnouncer />
    </div>
  );
}
