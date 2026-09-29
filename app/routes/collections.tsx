import type { Route } from "./+types/collections";
import { runInBackground } from "~/lib/vault/background";
import { createCollection } from "~/lib/vault/collection-mutations";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const vault = await requireVault(request);
  const parentId = (await request.formData()).get("parentId");

  runInBackground(createCollection(vault, parentId ? String(parentId) : null));
  return null;
}
