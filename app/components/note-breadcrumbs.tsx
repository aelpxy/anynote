import { ChevronRight } from "lucide-react";
import { useRouteLoaderData } from "react-router";

import { useOpenSidebarNote } from "~/hooks/use-sidebar-selection";
import { flattenCollections } from "~/lib/vault/queries";
import type { clientLoader } from "~/routes/sidebar-layout";

type NoteBreadcrumbsProps = {
  title: string;
};

const collectionSourcePrefix = "collection:";

export function NoteBreadcrumbs({ title }: NoteBreadcrumbsProps) {
  const { source } = useOpenSidebarNote();
  const layoutData = useRouteLoaderData<typeof clientLoader>("routes/sidebar-layout");
  if (!source.startsWith(collectionSourcePrefix)) return null;

  const collectionId = source.slice(collectionSourcePrefix.length);
  const option = flattenCollections(layoutData?.collections ?? []).find(
    ({ collection }) => collection.id === collectionId,
  );
  if (!option) return null;

  const crumbs = [...option.label.split(" / "), title];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm text-neutral-500">
        {crumbs.map((crumb, index) => (
          <li key={index} className="flex min-w-0 items-center gap-1">
            {index > 0 && (
              <ChevronRight aria-hidden className="size-3.5 shrink-0" />
            )}
            <span
              className={[
                "truncate",
                index === crumbs.length - 1
                  ? "text-neutral-800 dark:text-neutral-200"
                  : "",
              ].join(" ")}
            >
              {crumb}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
