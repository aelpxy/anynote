export function LinkPreviewSkeleton() {
  return (
    <div aria-hidden className="animate-pulse motion-reduce:animate-none">
      <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mt-3 h-3.5 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mt-2 h-3 w-full rounded bg-neutral-100 dark:bg-neutral-700/60" />
      <div className="mt-1.5 h-3 w-4/5 rounded bg-neutral-100 dark:bg-neutral-700/60" />
    </div>
  );
}
