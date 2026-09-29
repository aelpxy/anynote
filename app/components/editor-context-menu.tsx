import { ContextMenu } from "@base-ui/react/context-menu";
import { type EditorState, TextSelection } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { useRef } from "react";

import { EditorContextMenuItems } from "~/components/editor-context-menu-items";
import { MenuPopup } from "~/components/menu-popup";
import type { LinkRange } from "~/lib/editor-selection";
import { saveAttachment } from "~/lib/vault/attachments";
import { getVault } from "~/lib/vault/store";

type EditorContextMenuProps = {
  view: EditorView | null;
  state: EditorState | null;
  onEditLink: (link: LinkRange) => void;
  onOpenLink: (href: string) => void;
  children: React.ReactNode;
};

export function EditorContextMenu({
  view,
  state,
  onEditLink,
  onOpenLink,
  children,
}: EditorContextMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleContextMenuCapture(event: React.MouseEvent) {
    const target = event.target instanceof Element ? event.target : null;
    // shift+right-click keeps the browser menu for spelling suggestions; code blocks keep theirs too
    if (!view || event.shiftKey || target?.closest(".milkdown-code-block")) {
      event.stopPropagation();
      return;
    }

    // act on what was clicked, not wherever the cursor happened to be
    const clicked = view.posAtCoords({ left: event.clientX, top: event.clientY });
    const { from, to } = view.state.selection;
    if (clicked && (clicked.pos < from || clicked.pos > to)) {
      view.dispatch(
        view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(clicked.pos))),
      );
    }
  }

  async function insertImages(files: FileList | null) {
    const vault = getVault();
    if (!view || !vault || !files) return;

    for (const file of Array.from(files).filter((item) => item.type.startsWith("image/"))) {
      try {
        const src = await saveAttachment(vault, file);
        const image = view.state.schema.nodes.image.create({
          src,
          alt: file.name.replace(/\.[^.]+$/, ""),
          title: "",
        });
        view.dispatch(view.state.tr.replaceSelectionWith(image));
      } catch (error) {
        console.error(`Failed to upload ${file.name}`, error);
      }
    }
    view.focus();
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger render={<div onContextMenuCapture={handleContextMenuCapture} />}>
        {children}
      </ContextMenu.Trigger>
      {view && state && (
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="z-50">
            <MenuPopup>
              <EditorContextMenuItems
                view={view}
                state={state}
                onEditLink={onEditLink}
                onOpenLink={onOpenLink}
                onInsertImage={() => fileInputRef.current?.click()}
              />
            </MenuPopup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          void insertImages(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
    </ContextMenu.Root>
  );
}
