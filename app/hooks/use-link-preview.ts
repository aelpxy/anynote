import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import {
  fetchLinkPreview,
  getNoteIdFromHref,
  type LinkPreview,
} from "~/lib/link-preview";
import type { clientLoader as notePreviewLoader } from "~/routes/note-preview";

export function useLinkPreview(href: string): LinkPreview | null {
  const noteId = getNoteIdFromHref(href);
  const { load, data, state } = useFetcher<typeof notePreviewLoader>();
  const [webPreview, setWebPreview] = useState<LinkPreview | null>(null);

  useEffect(() => {
    if (noteId) {
      void load(`/notes/${noteId}/preview`);
      return;
    }

    let isCurrent = true;
    setWebPreview(null);
    void fetchLinkPreview(href).then((preview) => {
      if (isCurrent) setWebPreview(preview);
    });
    return () => {
      isCurrent = false;
    };
  }, [href, noteId, load]);

  if (!noteId) return webPreview;
  if (!data || state !== "idle") return null;

  return {
    title: data.preview?.title ?? "Note not found",
    description: data.preview?.excerpt ?? "This note may have been deleted.",
    siteName: "Anynote",
    domain: "",
    isNote: true,
  };
}
