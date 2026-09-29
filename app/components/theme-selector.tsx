import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "~/hooks/use-theme";
import type { Theme } from "~/lib/theme";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label="Theme" className="flex gap-2">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-300 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 aria-checked:border-neutral-900 aria-checked:font-medium aria-checked:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:aria-checked:border-neutral-100 dark:aria-checked:text-neutral-100"
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
