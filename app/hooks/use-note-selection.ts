import { useSyncExternalStore } from "react";

import { getNoteSelection, subscribeToNoteSelection } from "~/lib/ui/note-selection";

export function useNoteSelection() {
  return useSyncExternalStore(subscribeToNoteSelection, getNoteSelection, getNoteSelection);
}
