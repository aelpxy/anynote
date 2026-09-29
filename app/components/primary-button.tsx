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
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending}
      className={[
        "flex h-9 items-center justify-center rounded-md bg-neutral-900 px-3 text-sm font-medium text-white transition-[background-color,scale] duration-150 hover:bg-neutral-700 active:scale-[0.97] motion-reduce:active:scale-100 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300",
        className ?? "w-full",
      ].join(" ")}
      {...props}
    >
      {isPending ? (pendingLabel ?? children) : children}
    </button>
  );
}
