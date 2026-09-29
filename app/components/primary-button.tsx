type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isPending?: boolean;
  pendingLabel?: string;
};

export function PrimaryButton({
  isPending,
  pendingLabel,
  disabled,
  children,
  type = "submit",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending}
      className="flex h-9 w-full items-center justify-center rounded-md bg-neutral-900 px-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      {...props}
    >
      {isPending ? (pendingLabel ?? children) : children}
    </button>
  );
}
