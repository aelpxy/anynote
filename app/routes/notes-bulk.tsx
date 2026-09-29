import { data, redirect } from "react-router";

import type { Route } from "./+types/notes-bulk";
import {
  placeNotesInCollection,
  removeNoteFromCollection,
} from "~/lib/vault/collection-mutations";
import { placeNotes, setNoteTrashed, updateNote } from "~/lib/vault/note-mutations";
import { readPlacement } from "~/lib/vault/placement";
import { requireVault } from "~/lib/vault/require-vault";
import type { Vault } from "~/lib/vault/types";

function readNoteIds(formData: FormData) {
  const noteIds: unknown = JSON.parse(String(formData.get("noteIds") ?? "[]"));
  if (!Array.isArray(noteIds) || !noteIds.every((id) => typeof id === "string")) {
    throw data("Invalid note ids", { status: 400 });
  }
  return noteIds as string[];
}

async function removeFromCollection(vault: Vault, collectionId: string, noteIds: string[]) {
  for (const noteId of noteIds) await removeNoteFromCollection(vault, collectionId, noteId);
}

function setFavorite(vault: Vault, noteIds: string[], isFavorite: boolean) {
  return Promise.all(noteIds.map((noteId) => updateNote(vault, noteId, { isFavorite })));
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const vault = await requireVault(request);
  const formData = await request.formData();
  const noteIds = readNoteIds(formData);
  const collectionId = String(formData.get("collectionId") ?? "");
  const fromCollectionId = String(formData.get("fromCollectionId") ?? "");
  const placement = readPlacement(formData);

  switch (formData.get("intent")) {
    case "favorite":
      await setFavorite(vault, noteIds, true);
      return null;
    case "unfavorite":
      await setFavorite(vault, noteIds, false);
      return null;
    case "trash":
      await Promise.all(noteIds.map((noteId) => setNoteTrashed(vault, noteId, true)));
      return formData.get("redirect") === "home" ? redirect("/") : null;
    case "add-to-collection":
      await placeNotesInCollection(vault, collectionId, noteIds, placement);
      if (fromCollectionId && fromCollectionId !== collectionId) {
        await removeFromCollection(vault, fromCollectionId, noteIds);
      }
      return null;
    case "remove-from-collection":
      await removeFromCollection(vault, collectionId, noteIds);
      return null;
    case "place":
      if (fromCollectionId) await removeFromCollection(vault, fromCollectionId, noteIds);
      if (formData.get("favorite") === "true") await setFavorite(vault, noteIds, true);
      if (placement) await placeNotes(vault, noteIds, placement);
      return null;
    default:
      throw data("Invalid intent", { status: 400 });
  }
}
