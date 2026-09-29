import { redirect } from "react-router";

import type { Route } from "./+types/notes";
import { createNote } from "~/lib/vault/note-mutations";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const note = await createNote(await requireVault(request));
  return redirect(`/notes/${note.id}`);
}
