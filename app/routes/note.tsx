import { data, redirect } from "react-router";

import type { Route } from "./+types/note";
import { NoteView } from "~/components/note-view";
import {
  addNoteToCollection,
  removeNoteFromCollection,
} from "~/lib/vault/collection-mutations";
import {
  duplicateNote,
  setNoteTrashed,
  updateNote,
} from "~/lib/vault/note-mutations";
import { getNote } from "~/lib/vault/queries";
import { runInBackground } from "~/lib/vault/background";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const note = getNote(await requireVault(request), params.noteId);
  if (!note) {
    throw data("Note not found", { status: 404 });
  }
  return { note };
}

const maxIconLength = 16;

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const vault = await requireVault(request);
  const formData = await request.formData();
  const { noteId } = params;

  switch (formData.get("intent")) {
    case "rename": {
      const title = String(formData.get("title")).trim();
      if (title) runInBackground(updateNote(vault, noteId, { title }));
      return null;
    }
    case "update-content":
      await updateNote(vault, noteId, { content: String(formData.get("content")) });
      return null;
    case "set-icon": {
      const icon = String(formData.get("icon") ?? "");
      if (icon.length > maxIconLength) throw data("Invalid icon", { status: 400 });
      runInBackground(updateNote(vault, noteId, { icon: icon || undefined }));
      return null;
    }
    case "favorite":
      runInBackground(updateNote(vault, noteId, { isFavorite: true }));
      return null;
    case "unfavorite":
      runInBackground(updateNote(vault, noteId, { isFavorite: false }));
      return null;
    case "duplicate":
      await duplicateNote(vault, noteId);
      return null;
    case "add-to-collection":
      runInBackground(addNoteToCollection(vault, String(formData.get("collectionId")), noteId));
      return null;
    case "remove-from-collection":
      runInBackground(
        removeNoteFromCollection(vault, String(formData.get("collectionId")), noteId),
      );
      return null;
    case "trash":
      runInBackground(setNoteTrashed(vault, noteId, true));
      return formData.get("redirect") === "home" ? redirect("/") : null;
    default:
      throw data("Invalid intent", { status: 400 });
  }
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData ? `${loaderData.note.title} · Anynote` : "Anynote" },
  ];
}

export default function NoteRoute({ loaderData }: Route.ComponentProps) {
  const { note } = loaderData;
  return <NoteView key={`${note.id}:${note.revision}`} note={note} />;
}
