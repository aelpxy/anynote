import { useNoteAppearance } from "~/hooks/use-note-appearance";
import { type NoteAppearance, setNoteAppearance } from "~/lib/note-appearance";
import { handleRadioGroupKeyDown } from "~/lib/ui/radio-group";

const options: { value: NoteAppearance["font"]; label: string; className: string }[] = [
  { value: "default", label: "Default", className: "font-sans" },
  { value: "serif", label: "Serif", className: "font-serif" },
  { value: "mono", label: "Mono", className: "font-mono" },
  { value: "system", label: "System", className: "font-system" },
];

export function NoteFontSelector() {
  const { font } = useNoteAppearance();

  return (
    <div
      role="radiogroup"
      aria-label="Note font"
      onKeyDown={(event) =>
        handleRadioGroupKeyDown(
          event,
          options.map((option) => option.value),
          font,
          (value) => setNoteAppearance("font", value),
        )
      }
      className="grid grid-cols-4 gap-2"
    >
      {options.map(({ value, label, className }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={font === value}
          tabIndex={font === value ? 0 : -1}
          onClick={() => setNoteAppearance("font", value)}
          className="flex flex-col items-center gap-1 rounded-md border border-neutral-300 py-2.5 text-neutral-700 transition-colors hover:bg-neutral-100 aria-checked:border-neutral-900 aria-checked:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:aria-checked:border-neutral-100 dark:aria-checked:text-neutral-100"
        >
          <span aria-hidden className={`text-2xl leading-none ${className}`}>
            Ag
          </span>
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </div>
  );
}
