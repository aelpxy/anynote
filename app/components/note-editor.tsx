import { MilkdownProvider } from "@milkdown/react";

import { NoteEditorContent } from "~/components/note-editor-content";

type NoteEditorProps = {
  ref?: React.Ref<HTMLDivElement>;
  defaultValue: string;
  onChange: (markdown: string) => void;
};

function showCopiedFeedback(event: React.MouseEvent<HTMLDivElement>) {
  const button =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>(".copy-button")
      : null;
  if (!button) return;

  button.dataset.copied = "true";
  setTimeout(() => delete button.dataset.copied, 1500);
}

export function NoteEditor({ ref, defaultValue, onChange }: NoteEditorProps) {
  return (
    <div ref={ref} className="note-editor font-note" onClick={showCopiedFeedback}>
      <MilkdownProvider>
        <NoteEditorContent defaultValue={defaultValue} onChange={onChange} />
      </MilkdownProvider>
    </div>
  );
}
