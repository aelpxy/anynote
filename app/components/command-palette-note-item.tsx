import { Command } from "cmdk";
import { FileText } from "lucide-react";

import { HighlightedText } from "~/components/highlighted-text";
import type { NoteSearchResult } from "~/lib/vault/types";

type CommandPaletteNoteItemProps = {
  result: NoteSearchResult;
  terms: string[];
  onSelect: () => void;
};

export function CommandPaletteNoteItem({
  result,
  terms,
  onSelect,
}: CommandPaletteNoteItemProps) {
  return (
    <Command.Item
      value={`note:${result.id}`}
      onSelect={onSelect}
      className="flex cursor-default items-start gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 select-none data-[selected=true]:bg-neutral-100 data-[selected=true]:text-neutral-900 dark:text-neutral-300 dark:data-[selected=true]:bg-neutral-700 dark:data-[selected=true]:text-neutral-100"
    >
      <FileText className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          <HighlightedText text={result.title} terms={terms} />
        </p>
        {result.snippet && (
          <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
            <HighlightedText text={result.snippet} terms={terms} />
          </p>
        )}
      </div>
    </Command.Item>
  );
}
