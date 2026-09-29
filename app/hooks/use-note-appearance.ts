import { useSyncExternalStore } from "react";

import {
  defaultNoteAppearance,
  getStoredNoteAppearance,
  subscribeToNoteAppearance,
} from "~/lib/note-appearance";

export function useNoteAppearance() {
  return useSyncExternalStore(
    subscribeToNoteAppearance,
    getStoredNoteAppearance,
    () => defaultNoteAppearance,
  );
}
