import { formatKey } from "~/lib/ui/shortcuts";

type KbdProps = {
  keys: string[];
};

export function Kbd({ keys }: KbdProps) {
  return (
    <span className="inline-flex gap-1">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-6 rounded border border-neutral-200 bg-neutral-50 px-1.5 text-center font-sans text-xs leading-5 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {formatKey(key)}
        </kbd>
      ))}
    </span>
  );
}
