import type { Route } from "./+types/note-preview";
import { getNotePreview } from "~/lib/vault/queries";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  return { preview: getNotePreview(await requireVault(request), params.noteId) };
}
