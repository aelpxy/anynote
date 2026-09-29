import { FileText } from "lucide-react";

import type { LinkPreview } from "~/lib/link-preview";

type LinkPreviewContentProps = {
  preview: LinkPreview;
};

export function LinkPreviewContent({ preview }: LinkPreviewContentProps) {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-neutral-100 text-[10px] font-semibold text-neutral-700 uppercase dark:bg-neutral-700 dark:text-neutral-200">
          {preview.isNote ? (
            <FileText className="size-3" />
          ) : (
            preview.siteName.charAt(0)
          )}
        </span>
        <span className="truncate">
          {preview.domain && preview.domain !== preview.siteName
            ? `${preview.siteName} · ${preview.domain}`
            : preview.siteName}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {preview.title}
      </p>
      {preview.description && (
        <p className="mt-1 line-clamp-3 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
          {preview.description}
        </p>
      )}
    </>
  );
}
