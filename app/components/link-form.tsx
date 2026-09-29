import { posToDOMRect } from "@milkdown/kit/prose";
import type { EditorView } from "@milkdown/kit/prose/view";
import { Check, Link } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { EditorToolbarButton } from "~/components/editor-toolbar-button";
import { FloatingToolbar } from "~/components/floating-toolbar";
import type { LinkRange } from "~/lib/editor-selection";
import { normalizeLinkInput } from "~/lib/safe-url";

type LinkFormProps = {
  view: EditorView;
  link: LinkRange;
  onClose: () => void;
};

export function LinkForm({ view, link, onClose }: LinkFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const reference = {
    getBoundingClientRect: () => posToDOMRect(view, link.from, link.to),
    contextElement: view.dom,
  };

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function close() {
    onClose();
    view.focus();
  }

  function save() {
    const input = inputRef.current?.value.trim() ?? "";
    const href = input ? normalizeLinkInput(input) : null;
    if (input && !href) {
      setError("Only web addresses, email addresses and links to notes are allowed.");
      inputRef.current?.focus();
      return;
    }

    const linkType = view.state.schema.marks.link;
    const tr = view.state.tr.removeMark(link.from, link.to, linkType);
    if (href) tr.addMark(link.from, link.to, linkType.create({ href }));
    view.dispatch(tr);
    close();
  }

  return (
    <FloatingToolbar reference={reference} label="Edit link" placement="bottom">
      <form
        className="flex flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="flex items-center gap-1">
          <Link className="ml-1.5 size-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
          <input
            ref={inputRef}
            aria-label="Link URL"
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            defaultValue={link.href}
            placeholder="Paste or type a link"
            onChange={() => setError(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape") close();
            }}
            onBlur={onClose}
            className="h-7 w-64 bg-transparent px-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400"
          />
          <EditorToolbarButton icon={Check} label="Save link" onClick={save} />
        </div>
        {error && (
          <p id={errorId} role="alert" className="max-w-80 px-1.5 pt-1 pb-0.5 text-xs text-neutral-700 dark:text-neutral-300">
            {error}
          </p>
        )}
      </form>
    </FloatingToolbar>
  );
}
