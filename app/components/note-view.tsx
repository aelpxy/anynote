import { useRef } from "react";

import { ExportMenu } from "~/components/export-menu";
import { MoveToTrashButton } from "~/components/move-to-trash-button";
import { NoteEditor } from "~/components/note-editor";
import { NoteTitleInput } from "~/components/note-title-input";
import { PageHeader } from "~/components/page-header";
import { useDebouncedCallback } from "~/hooks/use-debounced-callback";
import { useNoteActions } from "~/hooks/use-note-actions";
import { usePageFileDrop } from "~/hooks/use-page-file-drop";
import type { NoteWithContent } from "~/lib/vault/types";

type NoteViewProps = {
  note: NoteWithContent;
};

export function NoteView({ note }: NoteViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const latestContentRef = useRef(note.content);
  const actions = useNoteActions(note.id);
  const saveContent = useDebouncedCallback(actions.saveContent, 500);
  usePageFileDrop(editorRef);

  function handleContentChange(markdown: string) {
    latestContentRef.current = markdown;
    saveContent(markdown);
  }

  function focusEditor() {
    editorRef.current?.querySelector<HTMLElement>(".ProseMirror")?.focus();
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <ExportMenu
              title={note.title}
              getMarkdown={() => latestContentRef.current}
            />
            <MoveToTrashButton />
          </>
        }
      />
      <article className="mx-auto max-w-3xl px-12 pt-2">
        <NoteTitleInput note={note} onContinue={focusEditor} />
        <div className="mt-4">
          <NoteEditor
            ref={editorRef}
            defaultValue={note.content}
            onChange={handleContentChange}
          />
        </div>
      </article>
    </>
  );
}
