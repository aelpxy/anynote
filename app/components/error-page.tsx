import { isRouteErrorResponse, Link } from "react-router";

import { Logo } from "~/components/logo";

type ErrorPageProps = {
  error: unknown;
  // outside the app shell there is no sidebar, so the page brings its own branding
  fullScreen?: boolean;
};

export function ErrorPage({ error, fullScreen }: ErrorPageProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const isNotFound = status === 404;
  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main
      className={[
        "flex flex-col items-center justify-center px-6 text-center",
        fullScreen ? "min-h-dvh" : "min-h-[70vh]",
      ].join(" ")}
    >
      {fullScreen && <Logo className="mb-6 size-9" />}
      <p className="text-sm font-medium text-neutral-500 tabular-nums">{status}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {isNotFound ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
        {isNotFound
          ? "This page doesn't exist or was deleted."
          : "An unexpected error occurred. Try reloading the page."}
      </p>
      <div className="mt-6 flex gap-2">
        {!isNotFound && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex h-9 items-center rounded-md bg-neutral-900 px-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Reload
          </button>
        )}
        <Link
          to="/"
          className={[
            "flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
            isNotFound
              ? "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              : "border border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800",
          ].join(" ")}
        >
          Go home
        </Link>
      </div>
      {stack && (
        <pre className="mt-10 max-h-72 w-full max-w-3xl overflow-auto rounded-md bg-neutral-100 p-4 text-left font-mono text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          {stack}
        </pre>
      )}
    </main>
  );
}
