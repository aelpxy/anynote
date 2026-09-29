import { Popover } from "@base-ui/react/popover";
import { Folder, Info } from "lucide-react";
import { useRouteLoaderData } from "react-router";

import { countWords } from "~/components/note-status";
import { formatRelativeTime } from "~/lib/relative-time";
import { flattenCollections } from "~/lib/vault/queries";
import type { NoteWithContent } from "~/lib/vault/types";
import type { clientLoader } from "~/routes/sidebar-layout";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type NoteInfoButtonProps = {
  note: NoteWithContent;
  markdown: string;
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <dt className="text-neutral-600 dark:text-neutral-400">{label}</dt>
      <dd className="text-right text-neutral-900 tabular-nums dark:text-neutral-100">{children}</dd>
    </div>
  );
}

export function NoteInfoButton({ note, markdown }: NoteInfoButtonProps) {
  const layoutData = useRouteLoaderData<typeof clientLoader>("routes/sidebar-layout");
  const collections = flattenCollections(layoutData?.collections ?? []).filter(
    ({ collection }) => collection.notes.some(({ id }) => id === note.id),
  );

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Note info"
        className="rounded-md p-1.5 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 data-popup-open:bg-neutral-100 data-popup-open:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 dark:data-popup-open:bg-neutral-900 dark:data-popup-open:text-neutral-100"
      >
        <Info className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} align="end" className="z-50">
          <Popover.Popup className="w-72 origin-(--transform-origin) rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-lg shadow-neutral-900/10 transition-[opacity,scale] duration-150 ease-out outline-none motion-reduce:transition-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40">
            <dl>
              <InfoRow label="Created">{dateFormatter.format(new Date(note.createdAt))}</InfoRow>
              <InfoRow label="Edited">
                <span title={dateFormatter.format(new Date(note.updatedAt))}>
                  {formatRelativeTime(note.updatedAt)}
                </span>
              </InfoRow>
              <InfoRow label="Words">{countWords(markdown).toLocaleString()}</InfoRow>
              <InfoRow label="Characters">{markdown.length.toLocaleString()}</InfoRow>
            </dl>
            <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
              <p className="py-1 text-neutral-600 dark:text-neutral-400">Collections</p>
              {collections.length === 0 ? (
                <p className="py-1 text-neutral-500 dark:text-neutral-400">None</p>
              ) : (
                <ul>
                  {collections.map(({ collection, label }) => (
                    <li
                      key={collection.id}
                      className="flex items-center gap-2 py-1 text-neutral-900 dark:text-neutral-100"
                    >
                      <Folder className="size-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                      <span className="truncate">{label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
