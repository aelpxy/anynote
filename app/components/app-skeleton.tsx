function Bar({ className }: { className: string }) {
  return <div className={`rounded-md bg-neutral-200/70 dark:bg-neutral-800/70 ${className}`} />;
}

// fades in late so quick loads never flash it
export function AppSkeleton() {
  return (
    <div aria-hidden className="flex h-dvh animate-appear-delayed">
      <div className="hidden h-full w-56 shrink-0 py-2 pl-2 md:block">
        <div className="flex h-full animate-pulse flex-col gap-3 rounded-xl motion-reduce:animate-none border border-neutral-200 bg-neutral-50 px-3 pt-14 dark:border-neutral-800 dark:bg-neutral-900">
          <Bar className="h-7 w-full" />
          <Bar className="h-7 w-full" />
          <div className="mt-4 flex flex-col gap-2.5">
            <Bar className="h-3 w-16" />
            <Bar className="h-4 w-36" />
            <Bar className="h-4 w-28" />
            <Bar className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl animate-pulse flex-col gap-3 px-5 motion-reduce:animate-none pt-16 sm:px-12">
        <Bar className="h-9 w-2/3" />
        <Bar className="mt-4 h-4 w-full" />
        <Bar className="h-4 w-11/12" />
        <Bar className="h-4 w-4/5" />
      </div>
    </div>
  );
}
