import type { Route } from "./+types/search";
import { ErrorPage } from "~/components/error-page";
import { SearchView } from "~/components/search-view";
import { requireVault } from "~/lib/vault/require-vault";
import { readSearchFilters, searchNotes } from "~/lib/vault/search";

const defaultLimit = 50;
const maxLimit = 100;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Search · Anynote" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "";
  const filters = readSearchFilters(params);
  const limit = Math.min(maxLimit, Math.max(1, Number(params.get("limit")) || defaultLimit));
  return {
    query,
    filters,
    results: searchNotes(await requireVault(request), query, { limit, filters }),
  };
}

export default function SearchRoute({ loaderData }: Route.ComponentProps) {
  return <SearchView {...loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
