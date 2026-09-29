type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SecondaryButton({ className, type = "button", ...props }: SecondaryButtonProps) {
  return (
    <button
      type={type}
      className={[
        "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-800 transition-[background-color,scale] duration-150 hover:bg-neutral-100 active:scale-[0.97] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
