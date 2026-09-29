import { Kbd } from "~/components/kbd";
import { NewCollectionButton } from "~/components/new-collection-button";
import { NewNoteButton } from "~/components/new-note-button";

export function HomeGetStarted() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">No notes yet</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Everything you write is encrypted before it leaves this device.
      </p>
      <div className="mt-6 flex gap-2">
        <NewNoteButton />
        <NewCollectionButton />
      </div>
      <p className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <Kbd keys={["Mod", "Alt", "N"]} /> new note
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys={["Mod", "K"]} /> search
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys={["?"]} /> all shortcuts
        </span>
      </p>
    </div>
  );
}
