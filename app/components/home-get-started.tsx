import { NewCollectionButton } from "~/components/new-collection-button";
import { NewNoteButton } from "~/components/new-note-button";

export function HomeGetStarted() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">No notes yet</h1>
      <div className="mt-6 flex gap-2">
        <NewNoteButton />
        <NewCollectionButton />
      </div>
    </div>
  );
}
