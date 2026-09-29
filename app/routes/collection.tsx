import { data } from "react-router";

import type { Route } from "./+types/collection";
import {
  deleteCollection,
  moveCollection,
  placeCollection,
  renameCollection,
} from "~/lib/vault/collection-mutations";
import { runInBackground } from "~/lib/vault/background";
import { readPlacement } from "~/lib/vault/placement";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const vault = await requireVault(request);
  const formData = await request.formData();
  const { collectionId } = params;

  switch (formData.get("intent")) {
    case "rename": {
      const name = String(formData.get("name")).trim();
      if (name) runInBackground(renameCollection(vault, collectionId, name));
      return null;
    }
    case "move": {
      const placement = readPlacement(formData);
      const parentId = formData.get("parentId");
      runInBackground(
        placement
          ? placeCollection(vault, collectionId, placement)
          : moveCollection(vault, collectionId, parentId ? String(parentId) : null),
      );
      return null;
    }
    case "delete":
      runInBackground(deleteCollection(vault, collectionId));
      return null;
    default:
      throw data("Invalid intent", { status: 400 });
  }
}
