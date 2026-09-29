import { Kbd } from "~/components/kbd";
import { shortcutGroups } from "~/lib/ui/shortcuts";

export function KeyboardShortcutsView() {
  return (
    <div className="flex flex-col gap-5">
      {shortcutGroups.map((group) => (
        <section key={group.heading}>
          <h3 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {group.heading}
          </h3>
          <ul className="mt-1.5 flex flex-col">
            {group.shortcuts.map((shortcut) => (
              <li
                key={shortcut.label}
                className="flex items-center justify-between gap-4 py-1 text-sm text-neutral-800 dark:text-neutral-200"
              >
                {shortcut.label}
                <Kbd keys={shortcut.keys} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
