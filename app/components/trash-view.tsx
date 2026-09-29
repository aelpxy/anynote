import { EmptyTrashButton } from "~/components/empty-trash-button";
import { PageHeader } from "~/components/page-header";
import { TrashItem } from "~/components/trash-item";
import type { Note } from "~/lib/vault/types";

type TrashViewProps = {
  notes: Note[];
};

export function TrashView({ notes }: TrashViewProps) {
  return (
    <>
      <PageHeader
        actions={
          notes.length > 0 && <EmptyTrashButton count={notes.length} />
        }
      />
      <section className="mx-auto max-w-3xl px-12 pt-2 pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
        {notes.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">
            Trash is empty.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-0.5">
            {notes.map((note) => (
              <TrashItem key={note.id} note={note} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
