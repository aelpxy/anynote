import { data } from "react-router";

import type { Route } from "./+types/trash";
import { TrashView } from "~/components/trash-view";
import { deleteNote, emptyTrash, setNoteTrashed } from "~/lib/vault/note-mutations";
import { getTrashedNotes } from "~/lib/vault/queries";
import { runInBackground } from "~/lib/vault/background";
import { requireVault } from "~/lib/vault/require-vault";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Trash · Anynote" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  return { notes: getTrashedNotes(await requireVault(request)) };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const vault = await requireVault(request);
  const formData = await request.formData();
  const noteId = String(formData.get("noteId"));

  switch (formData.get("intent")) {
    case "restore":
      runInBackground(setNoteTrashed(vault, noteId, false));
      return null;
    case "delete":
      runInBackground(deleteNote(vault, noteId));
      return null;
    case "empty":
      runInBackground(emptyTrash(vault));
      return null;
    default:
      throw data("Invalid intent", { status: 400 });
  }
}

export default function TrashRoute({ loaderData }: Route.ComponentProps) {
  return <TrashView notes={loaderData.notes} />;
}
