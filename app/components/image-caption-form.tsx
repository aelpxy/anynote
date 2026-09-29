import type { EditorView } from "@milkdown/kit/prose/view";
import { Captions, Check } from "lucide-react";
import { useEffect, useRef } from "react";

import { EditorToolbarButton } from "~/components/editor-toolbar-button";
import { FloatingToolbar } from "~/components/floating-toolbar";

type ImageCaptionFormProps = {
  view: EditorView;
  pos: number;
  onClose: () => void;
};

export function ImageCaptionForm({ view, pos, onClose }: ImageCaptionFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const node = view.state.doc.nodeAt(pos);
  const wrapper = view.nodeDOM(pos);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  if (!node || node.type.name !== "image" || !(wrapper instanceof Element)) return null;

  function close() {
    onClose();
    view.focus();
  }

  function save() {
    const current = view.state.doc.nodeAt(pos);
    if (current) {
      const title = inputRef.current?.value.replace(/\s+/g, " ").trim() ?? "";
      view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, title }));
    }
    close();
  }

  return (
    <FloatingToolbar reference={wrapper} label="Edit caption" placement="bottom">
      <form
        className="flex items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Captions className="ml-1.5 size-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
        <input
          ref={inputRef}
          aria-label="Image caption"
          defaultValue={String(node.attrs.title ?? "")}
          placeholder="Add a caption"
          maxLength={200}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          onBlur={onClose}
          className="h-7 w-64 bg-transparent px-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400"
        />
        <EditorToolbarButton icon={Check} label="Save caption" onClick={save} />
      </form>
    </FloatingToolbar>
  );
}
