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
import { columnResizing } from "@milkdown/kit/prose/tables";
import {
  commonmark,
  headingIdGenerator,
} from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import type { EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";
import { Milkdown, useEditor } from "@milkdown/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useMatch, useNavigate, useRouteLoaderData } from "react-router";

import { EditorContextMenu } from "~/components/editor-context-menu";
import { EditorToolbars } from "~/components/editor-toolbars";
import { FindBar } from "~/components/find-bar";
import { ImageLightbox } from "~/components/image-lightbox";
import { LinkHoverPreview } from "~/components/link-hover-preview";
import { NoteLinkSuggest } from "~/components/note-link-suggest";
import { TableAddControls } from "~/components/table-add-controls";
import { autolinkPlugin } from "~/lib/autolink-plugin";
import { bookmarkPromptPlugin, bookmarkRemark, bookmarkSchema, bookmarkView } from "~/lib/bookmark";
import { codeBlockOptions } from "~/lib/code-block-options";
import type { LinkRange } from "~/lib/editor-selection";
import { createViewBridgePlugin } from "~/lib/editor-view-bridge-plugin";
import { encryptedImageView } from "~/lib/encrypted-image-view";
import { nullSafeImageSchema } from "~/lib/image-schema";
import { findPlugin } from "~/lib/find-plugin";
import { imagePastePlugin } from "~/lib/image-paste-plugin";
import { createKeyInterceptPlugin, type KeyInterceptor } from "~/lib/key-intercept-plugin";
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
import {
  tableCellWithWidthSchema,
  tableColumnsRemark,
  tableHeaderWithWidthSchema,
  tableWithColumnsSchema,
} from "~/lib/table-columns";
import { taskListPlugin } from "~/lib/task-list-plugin";
import type { clientLoader as layoutLoader } from "~/routes/sidebar-layout";

const tableColumnResizing = $prose(() => columnResizing({ cellMinWidth: 60, handleWidth: 6 }));

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
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/sidebar-layout");
  const currentNoteId = useMatch("/notes/:noteId")?.params.noteId;
  const linkableNotes = (layoutData?.documents ?? []).filter(({ id }) => id !== currentNoteId);
  const keyInterceptorRef = useRef<KeyInterceptor | null>(null);
  const [find, setFind] = useState<{ initialQuery: string; focusRequest: number } | null>(null);
  const [snapshot, setSnapshot] = useState<EditorSnapshot | null>(null);
  const [editingLink, setEditingLink] = useState<LinkRange | null>(null);
  const [editingCaptionPos, setEditingCaptionPos] = useState<number | null>(null);
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
            // copying an image in a browser also copies an <img> tag; the file is what should be kept
            enableHtmlFileUploader: true,
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
        .use(createKeyInterceptPlugin(keyInterceptorRef))
        .use(commonmark)
        .use(nullSafeImageSchema)
        .use(tableColumnResizing)
        .use(gfm)
        .use(tableColumnsRemark)
        .use(tableWithColumnsSchema)
        .use(tableCellWithWidthSchema)
        .use(tableHeaderWithWidthSchema)
        .use(bookmarkRemark)
        .use(bookmarkSchema)
        .use(history)
        .use(listener)
        // before clipboard so pasting a URL onto a selection links it instead of replacing it
        .use(autolinkPlugin)
        // before upload so text copied from office apps isn't replaced by their picture of it
        .use(imagePastePlugin)
        // before clipboard so pasted screenshots upload instead of being dropped
        .use(upload)
        .use(clipboard)
        .use(trailing)
        .use(cursor)
        .use(encryptedImageView)
        .use(bookmarkView)
        .use(bookmarkPromptPlugin)
        .use(headingAnchorPlugin)
        .use(taskListPlugin)
        .use(findPlugin)
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

  const handleFindShortcut = useEffectEvent((event: KeyboardEvent) => {
    const isMod = event.metaKey || event.ctrlKey;
    if (!isMod || event.altKey || event.shiftKey || event.key.toLowerCase() !== "f") return;
    const view = snapshot?.view;
    if (!view) return;
    event.preventDefault();

    const { from, to, empty } = view.state.selection;
    const selected = empty ? "" : view.state.doc.textBetween(from, to, " ");
    const initialQuery = selected.includes("\n") ? "" : selected.slice(0, 100);
    setFind((open) => ({
      initialQuery: open?.initialQuery ?? initialQuery,
      focusRequest: (open?.focusRequest ?? 0) + 1,
    }));
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleFindShortcut(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

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
            editingCaptionPos={editingCaptionPos}
            onEditCaption={setEditingCaptionPos}
            onOpenLink={openLink}
          />
          <LinkHoverPreview root={snapshot.view.dom} onOpen={openLink} />
          <TableAddControls view={snapshot.view} />
          <ImageLightbox />
          {find && (
            <FindBar
              view={snapshot.view}
              state={snapshot.state}
              initialQuery={find.initialQuery}
              focusRequest={find.focusRequest}
              onClose={() => setFind(null)}
            />
          )}
          <NoteLinkSuggest
            view={snapshot.view}
            state={snapshot.state}
            notes={linkableNotes}
            interceptorRef={keyInterceptorRef}
          />
        </>
      )}
    </>
  );
}
