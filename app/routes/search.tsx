import type { Route } from "./+types/search";
import { requireVault } from "~/lib/vault/require-vault";
import { searchNotes } from "~/lib/vault/search";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return { results: searchNotes(await requireVault(request), query) };
}
