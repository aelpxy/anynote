import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";

import { useTheme } from "~/hooks/use-theme";
import type { Theme } from "~/lib/theme";
import { handleRadioGroupKeyDown } from "~/lib/ui/radio-group";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const thumbId = useId();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      onKeyDown={(event) =>
        handleRadioGroupKeyDown(event, options.map((option) => option.value), theme, setTheme)
      }
      className="flex gap-2"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          tabIndex={theme === value ? 0 : -1}
          onClick={() => setTheme(value)}
          className="relative flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-300 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 aria-checked:font-medium aria-checked:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:aria-checked:text-neutral-100"
        >
          {theme === value && (
            <motion.span
              layoutId={thumbId}
              transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
              className="absolute -inset-px rounded-md border border-neutral-900 dark:border-neutral-100"
            />
          )}
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
