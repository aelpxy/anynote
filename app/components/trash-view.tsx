import { AnimatePresence } from "motion/react";

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
      <section className="mx-auto max-w-3xl px-5 pt-2 pb-8 sm:px-12">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trash</h1>
        {notes.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">
            Trash is empty.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-0.5">
            <AnimatePresence initial={false}>
              {notes.map((note) => (
                <TrashItem key={note.id} note={note} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </>
  );
}
