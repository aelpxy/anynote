import type { Node } from "@milkdown/kit/prose/model";
import { Plugin, PluginKey, type EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $nodeSchema, $prose, $remark, $view } from "@milkdown/kit/utils";

import type { LinkRange } from "~/lib/editor-selection";
import { htmlValueOf } from "~/lib/table-columns";
import { fetchLinkPreview } from "~/lib/link-preview";

const commentPattern = /^<!--\s*anynote:bookmark\s+(\{[\s\S]*\})\s*-->$/;
const iconSize = 32;

export type BookmarkAttrs = {
  href: string;
  title: string;
  description: string;
  siteName: string;
  icon: string;
};

type MarkdownNode = {
  type: string;
  url?: string;
  value?: string;
  children?: MarkdownNode[];
} & Partial<BookmarkAttrs>;

function textOf(node: MarkdownNode): string {
  return node.value ?? (node.children ?? []).map(textOf).join("");
}

function readString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] : "";
}

function parseComment(value: string) {
  const match = commentPattern.exec(value.trim());
  if (!match) return null;
  try {
    const meta = JSON.parse(match[1]) as Record<string, unknown>;
    const icon = readString(meta, "icon");
    return {
      description: readString(meta, "description"),
      siteName: readString(meta, "siteName"),
      icon: icon.startsWith("data:image/png;base64,") ? icon : "",
    };
  } catch {
    return null;
  }
}

function isWebUrl(href: string) {
  return /^https?:\/\//i.test(href);
}

function formatComment(attrs: BookmarkAttrs) {
  const meta = JSON.stringify({
    description: attrs.description || undefined,
    siteName: attrs.siteName || undefined,
    icon: attrs.icon || undefined,
  })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/--/g, "-\\u002d");
  return `<!-- anynote:bookmark ${meta} -->`;
}

function applyBookmarks(node: MarkdownNode) {
  const children = node.children;
  if (!children) return;
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const next = children[index + 1];
    const html = htmlValueOf(child);
    const meta = html !== null ? parseComment(html) : null;
    const link = next?.type === "paragraph" && next.children?.length === 1 ? next.children[0] : null;
    if (!meta || link?.type !== "link" || !link.url || !isWebUrl(link.url)) {
      applyBookmarks(child);
      continue;
    }
    children.splice(index, 2, {
      type: "anynoteBookmark",
      href: link.url,
      title: textOf(link),
      ...meta,
    });
  }
}

export const bookmarkRemark = $remark("anynoteBookmarks", () => () => (tree) => {
  applyBookmarks(tree as MarkdownNode);
});

export const bookmarkSchema = $nodeSchema("bookmark", () => ({
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  attrs: {
    href: { default: "" },
    title: { default: "" },
    description: { default: "" },
    siteName: { default: "" },
    icon: { default: "" },
  },
  parseDOM: [
    {
      tag: "div[data-bookmark]",
      getAttrs: (dom) => {
        const element = dom as HTMLElement;
        return {
          href: element.dataset.bookmark ?? "",
          title: element.dataset.title ?? "",
          description: element.dataset.description ?? "",
          siteName: element.dataset.siteName ?? "",
          icon: element.dataset.icon ?? "",
        };
      },
    },
  ],
  toDOM: (node) => [
    "div",
    {
      "data-bookmark": node.attrs.href,
      "data-title": node.attrs.title,
      "data-description": node.attrs.description,
      "data-site-name": node.attrs.siteName,
      "data-icon": node.attrs.icon,
    },
    ["a", { href: node.attrs.href }, node.attrs.title || node.attrs.href],
  ],
  parseMarkdown: {
    match: (node) => node.type === "anynoteBookmark",
    runner: (state, node, type) => {
      const { href, title, description, siteName, icon } = node as MarkdownNode;
      state.addNode(type, { href, title, description, siteName, icon });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "bookmark",
    runner: (state, node) => {
      const attrs = node.attrs as BookmarkAttrs;
      state.addNode("html", undefined, formatComment(attrs));
      state
        .openNode("paragraph")
        .openNode("link", undefined, { url: attrs.href })
        .addNode("text", undefined, attrs.title || attrs.href)
        .closeNode()
        .closeNode();
    },
  },
}));

function domainOf(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

export const bookmarkView = $view(bookmarkSchema.node, () => (initialNode) => {
  const wrapper = document.createElement("div");
  wrapper.className = "note-bookmark";
  wrapper.contentEditable = "false";
  const link = document.createElement("a");
  link.className = "note-bookmark-link";
  link.rel = "noopener noreferrer";
  link.target = "_blank";
  const title = document.createElement("span");
  title.className = "note-bookmark-title";
  const description = document.createElement("span");
  description.className = "note-bookmark-description";
  const site = document.createElement("span");
  site.className = "note-bookmark-site";
  const icon = document.createElement("img");
  icon.alt = "";
  const siteLabel = document.createElement("span");
  site.append(icon, siteLabel);
  link.append(title, description, site);
  wrapper.append(link);

  link.addEventListener("click", (event) => event.preventDefault());

  let node = initialNode;

  function render(next: Node) {
    const attrs = next.attrs as BookmarkAttrs;
    const domain = domainOf(attrs.href);
    link.href = attrs.href;
    title.textContent = attrs.title || domain;
    description.textContent = attrs.description;
    description.hidden = !attrs.description;
    siteLabel.textContent =
      attrs.siteName && attrs.siteName !== domain ? `${attrs.siteName} · ${domain}` : domain;
    icon.hidden = !attrs.icon;
    if (attrs.icon) icon.src = attrs.icon;
    else icon.removeAttribute("src");
  }

  render(node);
  return {
    dom: wrapper,
    update(next) {
      if (next.type !== node.type) return false;
      node = next;
      render(next);
      return true;
    },
    ignoreMutation: () => true,
  };
});

async function toSmallIcon(dataUrl: string | undefined) {
  if (!dataUrl) return "";
  try {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = iconSize;
    canvas.height = iconSize;
    const context = canvas.getContext("2d");
    if (!context) return "";
    const scale = Math.min(iconSize / image.naturalWidth, iconSize / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (iconSize - width) / 2, (iconSize - height) / 2, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

async function loadBookmarkAttrs(href: string): Promise<Partial<BookmarkAttrs>> {
  const preview = await fetchLinkPreview(href);
  return {
    title: preview.title,
    description: preview.description,
    siteName: preview.siteName,
    icon: await toSmallIcon(preview.icon),
  };
}

function updateBookmarks(view: EditorView, href: string, attrs: Partial<BookmarkAttrs>) {
  const { tr } = view.state;
  view.state.doc.descendants((node, pos) => {
    if (node.type.name === "bookmark" && node.attrs.href === href) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
    }
  });
  if (tr.docChanged) view.dispatch(tr);
}

export function canShowAsBookmark(view: EditorView, link: LinkRange) {
  const $from = view.state.doc.resolve(link.from);
  const paragraph = $from.parent;
  return (
    isWebUrl(link.href) &&
    paragraph.type.name === "paragraph" &&
    $from.depth === 1 &&
    link.from === $from.start() &&
    link.to === $from.end()
  );
}

export function showAsBookmark(view: EditorView, link: LinkRange) {
  const type = view.state.schema.nodes.bookmark;
  const $from = view.state.doc.resolve(link.from);
  if (!type || !canShowAsBookmark(view, link)) return;

  const text = view.state.doc.textBetween(link.from, link.to);
  const customTitle = text === link.href ? "" : text;
  const bookmark = type.create({ href: link.href, title: customTitle });
  view.dispatch(view.state.tr.replaceWith($from.before(), $from.after(), bookmark));
  view.focus();
  void refreshBookmark(view, link.href, { keepTitle: Boolean(customTitle) });
}

export async function refreshBookmark(view: EditorView, href: string, { keepTitle = false } = {}) {
  const { title, ...rest } = await loadBookmarkAttrs(href);
  if (!view.isDestroyed) updateBookmarks(view, href, keepTitle ? rest : { title, ...rest });
}

export function showAsLink(view: EditorView, pos: number, node: Node) {
  const { schema } = view.state;
  const attrs = node.attrs as BookmarkAttrs;
  const text = schema.text(attrs.title || attrs.href, [schema.marks.link.create({ href: attrs.href })]);
  view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, schema.nodes.paragraph.create(null, text)));
  view.focus();
}

export const bookmarkPromptKey = new PluginKey<LinkRange | null>("bookmark-prompt");

function pastedLink(state: EditorState): LinkRange | null {
  const { $from, empty } = state.selection;
  const paragraph = $from.parent;
  const child = paragraph.childCount === 1 ? paragraph.firstChild : null;
  const href = child && state.schema.marks.link.isInSet(child.marks)?.attrs.href;
  if (!empty || $from.depth !== 1 || paragraph.type.name !== "paragraph" || typeof href !== "string") {
    return null;
  }
  return isWebUrl(href) ? { from: $from.start(), to: $from.end(), href } : null;
}

export function dismissBookmarkPrompt(view: EditorView) {
  view.dispatch(view.state.tr.setMeta(bookmarkPromptKey, null));
}

export const bookmarkPromptPlugin = $prose(() => {
  let isPasting = false;
  return new Plugin<LinkRange | null>({
    key: bookmarkPromptKey,
    state: {
      init: () => null,
      apply(tr, previous) {
        const meta = tr.getMeta(bookmarkPromptKey) as LinkRange | null | undefined;
        if (meta !== undefined) return meta;
        return tr.docChanged || tr.selectionSet ? null : previous;
      },
    },
    props: {
      handleDOMEvents: {
        paste() {
          isPasting = true;
          return false;
        },
      },
    },
    view: () => ({
      update(view, previousState) {
        if (!isPasting || view.state.doc.eq(previousState.doc)) return;
        isPasting = false;
        const link = pastedLink(view.state);
        if (link) view.dispatch(view.state.tr.setMeta(bookmarkPromptKey, link));
      },
    }),
  });
});
