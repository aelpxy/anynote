import { AnimatePresence } from "motion/react";
import { useState } from "react";

import { AppDialogs } from "~/components/app-dialogs";
import { CommandPalette } from "~/components/command-palette";
import { Sidebar } from "~/components/sidebar";
import { SidebarToggle } from "~/components/sidebar-toggle";
import { Toaster } from "~/components/toaster";
import { useAppShortcuts } from "~/hooks/use-app-shortcuts";
import { useCrossTabLock } from "~/hooks/use-cross-tab-lock";
import { useHotkey } from "~/hooks/use-hotkey";
import { useLayout } from "~/hooks/use-layout";
import { usePreventFileNavigation } from "~/hooks/use-prevent-file-navigation";
import { useVaultSync } from "~/hooks/use-vault-sync";
import { toggleSidebar } from "~/lib/ui/layout-store";
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const isSidebarVisible = layout.isSidebarOpen && !layout.isFocusMode;

  useHotkey("k", () => setIsCommandPaletteOpen((isOpen) => !isOpen));
  useAppShortcuts(documents);
  useVaultSync();
  useCrossTabLock();
  usePreventFileNavigation();

  return (
    <div className="relative flex h-dvh print:block print:h-auto">
      {!layout.isFocusMode && (
        <div className="absolute top-4 left-4 z-10 print:hidden">
          <SidebarToggle isOpen={layout.isSidebarOpen} onToggle={toggleSidebar} />
        </div>
      )}
      <AnimatePresence initial={false}>
        {isSidebarVisible && (
          <Sidebar
            favorites={favorites}
            documents={documents}
            collections={collections}
            width={layout.sidebarWidth}
            onSearch={() => setIsCommandPaletteOpen(true)}
          />
        )}
      </AnimatePresence>
      <main className="flex-1 overflow-y-auto print:overflow-visible">
        {children}
      </main>
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />
      <AppDialogs />
      <Toaster />
    </div>
  );
}
