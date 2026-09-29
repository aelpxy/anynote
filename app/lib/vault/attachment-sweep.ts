import { sweepAttachments } from "~/lib/api/attachments";
import type { Vault } from "~/lib/vault/types";

const attachmentReference = /attachment:([0-9a-f-]{36})/g;
const sweptWorkspaces = new Set<string>();

// only the client can read which images notes still use; trashed notes count so restoring keeps images
export async function sweepUnusedAttachments(vault: Vault) {
  if (sweptWorkspaces.has(vault.workspaceId)) return;
  sweptWorkspaces.add(vault.workspaceId);

  const keep = new Set<string>();
  for (const note of vault.notes.values()) {
    for (const [, id] of note.content.matchAll(attachmentReference)) keep.add(id);
  }

  try {
    await sweepAttachments(vault.token, vault.workspaceId, [...keep]);
  } catch (error) {
    sweptWorkspaces.delete(vault.workspaceId);
    console.error("Unused attachment cleanup failed", error);
  }
}
