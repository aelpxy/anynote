import { useEffect, useEffectEvent } from "react";
import { useMatch, useNavigate, useSubmit } from "react-router";

import { setOpenDialog } from "~/lib/ui/dialog-store";
import { toggleFocusMode, toggleSidebar } from "~/lib/ui/layout-store";
import { isTypingTarget } from "~/lib/ui/shortcuts";
import type { Note } from "~/lib/vault/types";

export function useAppShortcuts(documents: Note[]) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const openNoteId = useMatch("/notes/:noteId")?.params.noteId;

  function openAdjacentNote(offset: number) {
    if (documents.length === 0) return;
    const index = documents.findIndex(({ id }) => id === openNoteId);
    const next =
      index === -1
        ? documents.at(offset > 0 ? 0 : -1)!
        : documents[(index + offset + documents.length) % documents.length];
    navigate(`/notes/${next.id}`, { state: { sidebarSource: "documents" } });
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    // windows reports AltGr as ctrl+alt, and AltGr combinations type characters
    if (event.defaultPrevented || event.getModifierState("AltGraph")) return;
    const isMod = event.metaKey || event.ctrlKey;

    let action: (() => void) | null = null;
    if (isMod && !event.altKey && event.key === "\\") action = toggleSidebar;
    else if (isMod && !event.altKey && event.key === ".") action = toggleFocusMode;
    else if (isMod && event.altKey && event.code === "KeyN") {
      action = () => submit(null, { method: "post", action: "/notes" });
    } else if (isMod && event.altKey && event.key === "ArrowUp") {
      action = () => openAdjacentNote(-1);
    } else if (isMod && event.altKey && event.key === "ArrowDown") {
      action = () => openAdjacentNote(1);
    } else if (event.key === "?" && !isMod && !isTypingTarget(event.target)) {
      action = () => setOpenDialog("shortcuts");
    }

    if (!action) return;
    event.preventDefault();
    action();
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}
