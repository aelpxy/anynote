import { data, redirect } from "react-router";

import type { Route } from "./+types/notes-bulk";
import { runInBackground } from "~/lib/vault/background";
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

function removeFromCollection(vault: Vault, collectionId: string, noteIds: string[]) {
  return noteIds.map((noteId) => removeNoteFromCollection(vault, collectionId, noteId));
}

function setFavorite(vault: Vault, noteIds: string[], isFavorite: boolean) {
  return noteIds.map((noteId) => updateNote(vault, noteId, { isFavorite }));
}

function setTrashed(vault: Vault, noteIds: string[], trashed: boolean) {
  return noteIds.map((noteId) => setNoteTrashed(vault, noteId, trashed));
}

// each mutation updates the local vault synchronously, so the ui can revalidate before the server answers
export async function clientAction({ request }: Route.ClientActionArgs) {
  const vault = await requireVault(request);
  const formData = await request.formData();
  const noteIds = readNoteIds(formData);
  const collectionId = String(formData.get("collectionId") ?? "");
  const fromCollectionId = String(formData.get("fromCollectionId") ?? "");
  const placement = readPlacement(formData);
  const writes: Promise<unknown>[] = [];

  switch (formData.get("intent")) {
    case "favorite":
      writes.push(...setFavorite(vault, noteIds, true));
      break;
    case "unfavorite":
      writes.push(...setFavorite(vault, noteIds, false));
      break;
    case "trash":
      writes.push(...setTrashed(vault, noteIds, true));
      break;
    case "restore":
      writes.push(...setTrashed(vault, noteIds, false));
      break;
    case "add-to-collection":
      writes.push(placeNotesInCollection(vault, collectionId, noteIds, placement));
      if (fromCollectionId && fromCollectionId !== collectionId) {
        writes.push(...removeFromCollection(vault, fromCollectionId, noteIds));
      }
      break;
    case "remove-from-collection":
      writes.push(...removeFromCollection(vault, collectionId, noteIds));
      break;
    case "place":
      if (fromCollectionId) writes.push(...removeFromCollection(vault, fromCollectionId, noteIds));
      if (formData.get("favorite") === "true") writes.push(...setFavorite(vault, noteIds, true));
      if (placement) writes.push(placeNotes(vault, noteIds, placement));
      break;
    default:
      throw data("Invalid intent", { status: 400 });
  }

  runInBackground(Promise.all(writes));
  return formData.get("redirect") === "home" ? redirect("/") : null;
}
