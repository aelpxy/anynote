import { useEffect, useRef, useState } from "react";

import { ExportMenu } from "~/components/export-menu";
import { MoveToTrashButton } from "~/components/move-to-trash-button";
import { NoteBacklinks } from "~/components/note-backlinks";
import { NoteBreadcrumbs } from "~/components/note-breadcrumbs";
import { NoteEditor } from "~/components/note-editor";
import { NoteIconPicker } from "~/components/note-icon-picker";
import { NoteInfoButton } from "~/components/note-info-button";
import { NoteOutline } from "~/components/note-outline";
import { NoteStatus } from "~/components/note-status";
import { NoteTitleInput } from "~/components/note-title-input";
import { PageHeader } from "~/components/page-header";
import { useConnection } from "~/hooks/use-connection";
import { useDebouncedCallback } from "~/hooks/use-debounced-callback";
import { useNoteScrollMemory } from "~/hooks/use-note-scroll-memory";
import { useNoteActions } from "~/hooks/use-note-actions";
import { usePageFileDrop } from "~/hooks/use-page-file-drop";
import { saveNowEvent } from "~/lib/ui/shortcuts";
import type { Note, NoteWithContent } from "~/lib/vault/types";

type NoteViewProps = {
  note: NoteWithContent;
  backlinks: Note[];
};

export function NoteView({ note, backlinks }: NoteViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const latestContentRef = useRef(note.content);
  const [markdown, setMarkdown] = useState(note.content);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const actions = useNoteActions(note.id);
  const saveContent = useDebouncedCallback((content: string) => {
    setHasUnsavedEdits(false);
    actions.saveContent(content);
  }, 500);
  usePageFileDrop(editorRef);
  useNoteScrollMemory(note.id, articleRef);

  useEffect(() => {
    const flush = saveContent.flush;
    window.addEventListener(saveNowEvent, flush);
    return () => window.removeEventListener(saveNowEvent, flush);
  }, [saveContent.flush]);

  function handleContentChange(content: string) {
    latestContentRef.current = content;
    setMarkdown(content);
    setHasUnsavedEdits(true);
    setHasEdited(true);
    saveContent(content);
  }

  const { isOffline } = useConnection();
  const isSaving = hasUnsavedEdits || actions.isSaving;
  const saveState = isSaving
    ? isOffline
      ? "unsynced"
      : "saving"
    : hasEdited
      ? "saved"
      : "idle";

  function focusEditor() {
    editorRef.current?.querySelector<HTMLElement>(".ProseMirror")?.focus();
  }

  return (
    <>
      <PageHeader
        leading={<NoteBreadcrumbs title={note.title} />}
        actions={
          <>
            <NoteStatus markdown={markdown} saveState={saveState} />
            <NoteInfoButton note={note} markdown={markdown} />
            <ExportMenu
              title={note.title}
              getMarkdown={() => latestContentRef.current}
            />
            <MoveToTrashButton noteId={note.id} />
          </>
        }
      />
      <h1 className="sr-only">{note.title}</h1>
      <article ref={articleRef} className="mx-auto max-w-(--note-page-width) px-5 pt-2 pb-[30vh] sm:px-12 print:pb-0">
        <div className="group/title">
          <NoteIconPicker icon={note.icon} onChange={actions.setIcon} />
          <NoteTitleInput note={note} onContinue={focusEditor} />
        </div>
        <div className="mt-4">
          <NoteEditor
            ref={editorRef}
            defaultValue={note.content}
            onChange={handleContentChange}
          />
        </div>
        <NoteBacklinks notes={backlinks} />
      </article>
      <NoteOutline editorRef={editorRef} />
    </>
  );
}
