import { redirect } from "react-router";

import type { Route } from "./+types/notes";
import { runInBackground } from "~/lib/vault/background";
import { addNewNoteToCollection } from "~/lib/vault/collection-mutations";
import { createNote } from "~/lib/vault/note-mutations";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const vault = await requireVault(request);
  const formData = await request.formData().catch(() => null);
  const collectionId = formData?.get("collectionId");
  const { note, saved } = createNote(vault);
  runInBackground(saved);
  if (collectionId) {
    runInBackground(addNewNoteToCollection(vault, String(collectionId), note.id, saved));
  }
  return redirect(`/notes/${note.id}`);
}
