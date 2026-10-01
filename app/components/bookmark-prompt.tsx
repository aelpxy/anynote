import { posToDOMRect } from "@milkdown/kit/prose";
import type { EditorView } from "@milkdown/kit/prose/view";
import { PanelTop } from "lucide-react";

import { FloatingToolbar } from "~/components/floating-toolbar";
import { dismissBookmarkPrompt, showAsBookmark } from "~/lib/bookmark";
import type { LinkRange } from "~/lib/editor-selection";

type BookmarkPromptProps = {
  view: EditorView;
  link: LinkRange;
};

const buttonClassName =
  "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100";

export function BookmarkPrompt({ view, link }: BookmarkPromptProps) {
  const reference = {
    getBoundingClientRect: () => posToDOMRect(view, link.from, link.to),
    contextElement: view.dom,
  };

  return (
    <FloatingToolbar reference={reference} label="Paste options" placement="bottom-start">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => showAsBookmark(view, link)}
        className={buttonClassName}
      >
        <PanelTop className="size-4" />
        Bookmark
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          dismissBookmarkPrompt(view);
          view.focus();
        }}
        className={buttonClassName}
      >
        Keep as link
      </button>
    </FloatingToolbar>
  );
}
