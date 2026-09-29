import { AnimatePresence } from "motion/react";
import { useState } from "react";

import { AppDialogs } from "~/components/app-dialogs";
import { CommandPalette } from "~/components/command-palette";
import { Sidebar } from "~/components/sidebar";
import { SidebarToggle } from "~/components/sidebar-toggle";
import { useCrossTabLock } from "~/hooks/use-cross-tab-lock";
import { useHotkey } from "~/hooks/use-hotkey";
import { usePreventFileNavigation } from "~/hooks/use-prevent-file-navigation";
import { useVaultSync } from "~/hooks/use-vault-sync";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useHotkey("k", () => setIsCommandPaletteOpen((isOpen) => !isOpen));
  useVaultSync();
  useCrossTabLock();
  usePreventFileNavigation();

  return (
    <div className="relative flex h-dvh print:block print:h-auto">
      <div className="absolute top-4 left-4 z-10 print:hidden">
        <SidebarToggle
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
        />
      </div>
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <Sidebar
            favorites={favorites}
            documents={documents}
            collections={collections}
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
    </div>
  );
}
