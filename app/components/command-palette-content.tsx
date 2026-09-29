import { Command } from "cmdk";
import {
  Columns2,
  FilePlus,
  Home,
  Keyboard,
  Maximize2,
  Monitor,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  Type,
  User,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate, useSubmit } from "react-router";

import { CommandPaletteItem } from "~/components/command-palette-item";
import { CommandPaletteNoteItem } from "~/components/command-palette-note-item";
import { useTheme } from "~/hooks/use-theme";
import { setNoteAppearance } from "~/lib/note-appearance";
import { setOpenDialog } from "~/lib/ui/dialog-store";
import { toggleFocusMode, toggleSidebar } from "~/lib/ui/layout-store";
import type { clientLoader as searchLoader } from "~/routes/search";

type PaletteCommand = {
  id: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
};

type PaletteCommandGroup = {
  heading: string;
  commands: PaletteCommand[];
};

type CommandPaletteContentProps = {
  onClose: () => void;
};

export function CommandPaletteContent({ onClose }: CommandPaletteContentProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const { setTheme } = useTheme();
  const { load, data } = useFetcher<typeof searchLoader>();
  const [query, setQuery] = useState("");
  const terms = query.trim().split(/\s+/).filter(Boolean);

  useEffect(() => {
    void load(`/search?q=${encodeURIComponent(query)}&limit=${query.trim() ? 20 : 8}`);
  }, [query, load]);

  const commandGroups: PaletteCommandGroup[] = [
    {
      heading: "Actions",
      commands: [
        {
          id: "new-note",
          label: "New note",
          icon: FilePlus,
          run: () => submit(null, { method: "post", action: "/notes" }),
        },
        {
          id: "toggle-sidebar",
          label: "Toggle sidebar",
          icon: PanelLeft,
          run: toggleSidebar,
        },
        {
          id: "toggle-focus-mode",
          label: "Toggle focus mode",
          icon: Maximize2,
          run: toggleFocusMode,
        },
        {
          id: "shortcuts",
          label: "Keyboard shortcuts",
          icon: Keyboard,
          run: () => setOpenDialog("shortcuts"),
        },
      ],
    },
    {
      heading: "Navigation",
      commands: [
        {
          id: "home",
          label: "Home",
          icon: Home,
          run: () => navigate("/"),
        },
        {
          id: "search",
          label: "Search all notes",
          icon: Search,
          run: () => navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search"),
        },
        {
          id: "trash",
          label: "Go to Trash",
          icon: Trash2,
          run: () => navigate("/trash"),
        },
      ],
    },
    {
      heading: "Workspace",
      commands: [
        {
          id: "create-workspace",
          label: "Create workspace",
          icon: Plus,
          run: () => setOpenDialog("create-workspace"),
        },
        {
          id: "account",
          label: "My account",
          icon: User,
          run: () => setOpenDialog("account"),
        },
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          run: () => setOpenDialog("settings"),
        },
      ],
    },
    {
      heading: "Theme",
      commands: [
        {
          id: "theme-light",
          label: "Switch to light theme",
          icon: Sun,
          run: () => setTheme("light"),
        },
        {
          id: "theme-dark",
          label: "Switch to dark theme",
          icon: Moon,
          run: () => setTheme("dark"),
        },
        {
          id: "theme-system",
          label: "Use system theme",
          icon: Monitor,
          run: () => setTheme("system"),
        },
      ],
    },
    {
      heading: "Note appearance",
      commands: [
        { id: "font-default", label: "Use default font", icon: Type, run: () => setNoteAppearance("font", "default") },
        { id: "font-serif", label: "Use serif font", icon: Type, run: () => setNoteAppearance("font", "serif") },
        { id: "font-mono", label: "Use mono font", icon: Type, run: () => setNoteAppearance("font", "mono") },
        { id: "font-system", label: "Use system font", icon: Type, run: () => setNoteAppearance("font", "system") },
        {
          id: "width-normal",
          label: "Use normal page width",
          icon: Columns2,
          run: () => setNoteAppearance("width", "normal"),
        },
        {
          id: "width-wide",
          label: "Use full page width",
          icon: Columns2,
          run: () => setNoteAppearance("width", "wide"),
        },
      ],
    },
  ];
  const matchingGroups = commandGroups
    .map((group) => ({
      ...group,
      commands: group.commands.filter((command) =>
        terms.every((term) =>
          command.label.toLowerCase().includes(term.toLowerCase()),
        ),
      ),
    }))
    .filter((group) => group.commands.length > 0);
  const results = data?.results ?? [];

  function run(action: () => void) {
    onClose();
    action();
  }

  return (
    <Command
      shouldFilter={false}
      className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-neutral-600 dark:**:[[cmdk-group-heading]]:text-neutral-400"
    >
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 dark:border-neutral-700">
        <Search className="size-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search notes or run a command…"
          className="h-11 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400"
        />
      </div>
      <Command.List className="max-h-96 overflow-y-auto p-1">
        <Command.Empty className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          No results found.
        </Command.Empty>
        {results.length > 0 && (
          <Command.Group heading={terms.length > 0 ? "Notes" : "Recent notes"}>
            {results.map((result) => (
              <CommandPaletteNoteItem
                key={result.id}
                result={result}
                terms={terms}
                onSelect={() => run(() => navigate(`/notes/${result.id}`))}
              />
            ))}
          </Command.Group>
        )}
        {query.trim() && (
          <Command.Group heading="Search">
            <CommandPaletteItem
              value="command:search-all"
              icon={Search}
              onSelect={() =>
                run(() => navigate(`/search?q=${encodeURIComponent(query.trim())}`))
              }
            >
              Search all notes for “{query.trim()}”
            </CommandPaletteItem>
          </Command.Group>
        )}
        {matchingGroups.map((group) => (
          <Command.Group key={group.heading} heading={group.heading}>
            {group.commands.map((command) => (
              <CommandPaletteItem
                key={command.id}
                value={`command:${command.id}`}
                icon={command.icon}
                onSelect={() => run(command.run)}
              >
                {command.label}
              </CommandPaletteItem>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command>
  );
}
