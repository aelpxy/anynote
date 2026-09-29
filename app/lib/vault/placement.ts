import type { Placement } from "~/lib/vault/types";

export function readPlacement(formData: FormData): Placement | undefined {
  const anchorId = formData.get("anchorId");
  const side = formData.get("side");
  if (!anchorId || (side !== "before" && side !== "after")) return undefined;
  return { anchorId: String(anchorId), side };
}

export function placementFields(placement?: Placement): Record<string, string> {
  return placement ? { anchorId: placement.anchorId, side: placement.side } : {};
}
