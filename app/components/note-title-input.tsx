import { useNoteActions } from "~/hooks/use-note-actions";
import type { Note } from "~/lib/vault/types";

type NoteTitleInputProps = {
  note: Note;
  onContinue: () => void;
};

export function NoteTitleInput({ note, onContinue }: NoteTitleInputProps) {
  const actions = useNoteActions(note.id);

  function save(value: string) {
    const title = value.replace(/\s+/g, " ").trim();
    if (title && title !== note.title) actions.rename(title);
  }

  return (
    <textarea
      aria-label="Note title"
      rows={1}
      defaultValue={note.title}
      placeholder="Untitled"
      onBlur={(event) => save(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "ArrowDown") {
          event.preventDefault();
          onContinue();
        }
      }}
      className="field-sizing-content w-full font-note resize-none bg-transparent text-2xl font-bold sm:text-3xl tracking-tight text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-600"
    />
  );
}
