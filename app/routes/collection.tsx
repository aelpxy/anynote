import { data } from "react-router";

import type { Route } from "./+types/collection";
import {
  deleteCollection,
  moveCollection,
  renameCollection,
} from "~/lib/vault/collection-mutations";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const vault = await requireVault(request);
  const formData = await request.formData();
  const { collectionId } = params;

  switch (formData.get("intent")) {
    case "rename": {
      const name = String(formData.get("name")).trim();
      if (name) await renameCollection(vault, collectionId, name);
      return null;
    }
    case "move": {
      const parentId = formData.get("parentId");
      await moveCollection(vault, collectionId, parentId ? String(parentId) : null);
      return null;
    }
    case "delete":
      await deleteCollection(vault, collectionId);
      return null;
    default:
      throw data("Invalid intent", { status: 400 });
  }
}
