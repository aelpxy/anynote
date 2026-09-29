import { redirect } from "react-router";

import type { Route } from "./+types/notes";
import { runInBackground } from "~/lib/vault/background";
import { createNote } from "~/lib/vault/note-mutations";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const { note, saved } = createNote(await requireVault(request));
  runInBackground(saved);
  return redirect(`/notes/${note.id}`);
}
