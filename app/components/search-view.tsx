import { FileText, Star } from "lucide-react";
import { useRef } from "react";
import { Link, useRouteLoaderData, useSearchParams } from "react-router";

import { HighlightedText } from "~/components/highlighted-text";
import { PageHeader } from "~/components/page-header";
import { useDebouncedCallback } from "~/hooks/use-debounced-callback";
import { formatRelativeTime } from "~/lib/relative-time";
import { flattenCollections } from "~/lib/vault/queries";
import type { NoteSearchResult, SearchFilters } from "~/lib/vault/types";
import type { clientLoader as layoutLoader } from "~/routes/sidebar-layout";

type SearchViewProps = {
  query: string;
  filters: SearchFilters;
  results: NoteSearchResult[];
};

const selectClassName =
  "h-8 rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-800 outline-none focus-visible:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200";

export function SearchView({ query, filters, results }: SearchViewProps) {
  const [, setSearchParams] = useSearchParams();
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/sidebar-layout");
  const collections = flattenCollections(layoutData?.collections ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const terms = query.split(/\s+/).filter(Boolean);

  function update(changes: Record<string, string | null>) {
    setSearchParams(
      (params) => {
        for (const [key, value] of Object.entries(changes)) {
          if (value) params.set(key, value);
          else params.delete(key);
        }
        return params;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  const updateQuery = useDebouncedCallback((value: string) => update({ q: value.trim() || null }), 200);

  return (
    <>
      <PageHeader />
      <section className="mx-auto max-w-3xl px-5 pt-2 pb-8 sm:px-12">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>
        <input
          ref={inputRef}
          type="search"
          aria-label="Search notes"
          placeholder="Search notes…"
          defaultValue={query}
          autoFocus
          onChange={(event) => updateQuery(event.currentTarget.value)}
          className="mt-6 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 focus-visible:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-400"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            aria-label="Collection"
            value={filters.collectionId ?? ""}
            onChange={(event) => update({ collection: event.currentTarget.value || null })}
            className={selectClassName}
          >
            <option value="">All collections</option>
            {collections.map(({ collection, label }) => (
              <option key={collection.id} value={collection.id}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Edited"
            value={filters.edited}
            onChange={(event) =>
              update({ edited: event.currentTarget.value === "any" ? null : event.currentTarget.value })
            }
            className={selectClassName}
          >
            <option value="any">Edited any time</option>
            <option value="week">Edited this week</option>
            <option value="month">Edited this month</option>
          </select>
          <button
            type="button"
            aria-pressed={filters.favoritesOnly}
            onClick={() => update({ favorites: filters.favoritesOnly ? null : "1" })}
            className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-300 px-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 aria-pressed:border-neutral-900 aria-pressed:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:aria-pressed:border-neutral-100 dark:aria-pressed:text-neutral-100"
          >
            <Star className="size-4" />
            Favorites
          </button>
        </div>

        {results.length === 0 ? (
          <p className="mt-8 text-sm text-neutral-600 dark:text-neutral-400">No notes match.</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-0.5">
            {results.map((result) => (
              <li key={result.id}>
                <Link
                  to={`/notes/${result.id}`}
                  className="flex items-start gap-2 rounded-md px-2 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  {result.icon ? (
                    <span aria-hidden className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-sm leading-none">
                      {result.icon}
                    </span>
                  ) : (
                    <FileText className="mt-0.5 size-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        <HighlightedText text={result.title} terms={terms} />
                      </p>
                      <span className="hidden shrink-0 text-xs text-neutral-500 dark:text-neutral-400 sm:inline">
                        {formatRelativeTime(result.updatedAt)}
                      </span>
                    </div>
                    {result.snippet && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <HighlightedText text={result.snippet} terms={terms} />
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
