import {
  codeBlockComponent,
  codeBlockConfig,
} from "@milkdown/kit/component/code-block";
import { defaultValueCtx, Editor, rootCtx } from "@milkdown/kit/core";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { cursor, dropCursorConfig } from "@milkdown/kit/plugin/cursor";
import { history } from "@milkdown/kit/plugin/history";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { trailing } from "@milkdown/kit/plugin/trailing";
import { upload, uploadConfig } from "@milkdown/kit/plugin/upload";
import {
  commonmark,
  headingIdGenerator,
} from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import type { EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { Milkdown, useEditor } from "@milkdown/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { EditorContextMenu } from "~/components/editor-context-menu";
import { EditorToolbars } from "~/components/editor-toolbars";
import { LinkHoverPreview } from "~/components/link-hover-preview";
import { autolinkPlugin } from "~/lib/autolink-plugin";
import { codeBlockOptions } from "~/lib/code-block-options";
import type { LinkRange } from "~/lib/editor-selection";
import { createViewBridgePlugin } from "~/lib/editor-view-bridge-plugin";
import { encryptedImageView } from "~/lib/encrypted-image-view";
import { nullSafeImageSchema } from "~/lib/image-schema";
import { imageUploader, uploadPlaceholder } from "~/lib/image-uploader";
import {
  headingAnchorPlugin,
  scrollToHeading,
  slugifyHeading,
} from "~/lib/heading-anchor-plugin";
import { createLinkClickPlugin } from "~/lib/link-click-plugin";
import { linkSanitizerPlugin } from "~/lib/link-sanitizer-plugin";
import { placeholderPlugin } from "~/lib/placeholder-plugin";
import { toSafeHref } from "~/lib/safe-url";
import { taskListPlugin } from "~/lib/task-list-plugin";

type EditorSnapshot = {
  view: EditorView;
  state: EditorState;
  hasFocus: boolean;
};

type NoteEditorContentProps = {
  defaultValue: string;
  onChange: (markdown: string) => void;
};

export function NoteEditorContent({
  defaultValue,
  onChange,
}: NoteEditorContentProps) {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<EditorSnapshot | null>(null);
  const [editingLink, setEditingLink] = useState<LinkRange | null>(null);
  const onChangeRef = useRef(onChange);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    onChangeRef.current = onChange;
    navigateRef.current = navigate;
  });

  function openLink(href: string) {
    const safeHref = toSafeHref(href);
    if (!safeHref) return;
    if (safeHref.startsWith("/") || safeHref.startsWith("#")) {
      navigateRef.current(safeHref);
    } else {
      window.open(safeHref, "_blank", "noopener,noreferrer");
    }
  }

  const { loading } = useEditor(
    (root) =>
      Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
          ctx.set(defaultValueCtx, defaultValue);
          ctx.set(headingIdGenerator.key, slugifyHeading);
          ctx.update(dropCursorConfig.key, (defaults) => ({
            ...defaults,
            color: "#a3a3a3",
            width: 2,
          }));
          ctx.update(uploadConfig.key, (defaults) => ({
            ...defaults,
            uploader: imageUploader,
            uploadWidgetFactory: uploadPlaceholder,
          }));
          ctx.update(codeBlockConfig.key, (defaults) => ({
            ...defaults,
            ...codeBlockOptions,
          }));
          ctx
            .get(listenerCtx)
            .markdownUpdated((_ctx, markdown, previousMarkdown) => {
              if (markdown !== previousMarkdown) onChangeRef.current(markdown);
            });
        })
        .use(commonmark)
        .use(nullSafeImageSchema)
        .use(gfm)
        .use(history)
        .use(listener)
        // before clipboard so pasting a URL onto a selection links it instead of replacing it
        .use(autolinkPlugin)
        // before clipboard so pasted screenshots upload instead of being dropped
        .use(upload)
        .use(clipboard)
        .use(trailing)
        .use(cursor)
        .use(encryptedImageView)
        .use(headingAnchorPlugin)
        .use(taskListPlugin)
        .use(placeholderPlugin)
        .use(createLinkClickPlugin(openLink))
        .use(linkSanitizerPlugin)
        .use(
          createViewBridgePlugin((view) =>
            setSnapshot({ view, state: view.state, hasFocus: view.hasFocus() }),
          ),
        )
        .use(codeBlockComponent),
    [],
  );

  useEffect(() => {
    // headings only exist after the editor mounts, so the browser's native hash scroll misses them
    if (!loading && window.location.hash) {
      scrollToHeading(decodeURIComponent(window.location.hash.slice(1)));
    }
  }, [loading]);

  return (
    <>
      <EditorContextMenu
        view={snapshot?.view ?? null}
        state={snapshot?.state ?? null}
        onEditLink={setEditingLink}
        onOpenLink={openLink}
      >
        <Milkdown />
      </EditorContextMenu>
      {snapshot && (
        <>
          <EditorToolbars
            view={snapshot.view}
            state={snapshot.state}
            hasFocus={snapshot.hasFocus}
            editingLink={editingLink}
            onEditLink={setEditingLink}
            onOpenLink={openLink}
          />
          <LinkHoverPreview root={snapshot.view.dom} onOpen={openLink} />
        </>
      )}
    </>
  );
}
