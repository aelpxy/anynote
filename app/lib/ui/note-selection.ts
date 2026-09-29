export type NoteSelection = {
  source: string | null;
  noteIds: string[];
  anchorId: string | null;
};

const emptySelection: NoteSelection = { source: null, noteIds: [], anchorId: null };

let selection = emptySelection;
const listeners = new Set<() => void>();

export function getNoteSelection() {
  return selection;
}

export function subscribeToNoteSelection(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setNoteSelection(next: NoteSelection) {
  selection = next;
  for (const listener of listeners) listener();
}

export function clearNoteSelection() {
  if (selection.noteIds.length > 0) setNoteSelection(emptySelection);
}

// the open note joins a new selection, the way file managers treat the focused item
export function toggleNoteSelection(source: string, noteId: string, openNoteId?: string) {
  const current = selection.source === source ? selection.noteIds : openNoteId ? [openNoteId] : [];
  const noteIds = current.includes(noteId)
    ? current.filter((id) => id !== noteId)
    : [...current, noteId];
  setNoteSelection({ source, noteIds, anchorId: noteId });
}

export function selectNoteRange(
  source: string,
  listIds: string[],
  noteId: string,
  openNoteId?: string,
) {
  const anchorId = (selection.source === source && selection.anchorId) || openNoteId || noteId;
  const start = listIds.indexOf(anchorId);
  const end = listIds.indexOf(noteId);
  if (start === -1 || end === -1) return;
  setNoteSelection({
    source,
    noteIds: listIds.slice(Math.min(start, end), Math.max(start, end) + 1),
    anchorId,
  });
}
