type SegmentedControlProps<Value extends string> = {
  label: string;
  value: Value;
  options: { value: Value; label: string }[];
  onChange: (value: Value) => void;
};

export function SegmentedControl<Value extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex rounded-md border border-neutral-300 p-0.5 dark:border-neutral-700"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className="rounded px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:text-neutral-900 aria-checked:bg-neutral-900 aria-checked:font-medium aria-checked:text-white dark:text-neutral-400 dark:hover:text-neutral-100 dark:aria-checked:bg-neutral-100 dark:aria-checked:text-neutral-900"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
