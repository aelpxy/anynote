import {
  tableCellSchema,
  tableHeaderSchema,
  tableSchema,
} from "@milkdown/kit/preset/gfm";
import type { Node } from "@milkdown/kit/prose/model";
import { $remark } from "@milkdown/kit/utils";

const commentPattern = /^<!--\s*anynote:columns\s+([\d,\sauto]+?)\s*-->$/;
const minColumnWidth = 40;
const maxColumnWidth = 2000;

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  data?: Record<string, unknown>;
};

function parseWidths(value: string) {
  const match = commentPattern.exec(value.trim());
  if (!match) return null;
  return match[1].split(",").map((part) => {
    const width = Number(part.trim());
    return Number.isInteger(width) && width >= minColumnWidth && width <= maxColumnWidth ? width : null;
  });
}

export function formatColumnsComment(widths: (number | null)[]) {
  return `<!-- anynote:columns ${widths.map((width) => (width ? Math.round(width) : "auto")).join(",")} -->`;
}

function applyColumnComments(node: MarkdownNode) {
  const children = node.children;
  if (!children) return;
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const next = children[index + 1];
    const widths = child.type === "html" && next?.type === "table" ? parseWidths(child.value ?? "") : null;
    if (!widths) {
      applyColumnComments(child);
      continue;
    }
    for (const row of next.children ?? []) {
      row.children?.forEach((cell, column) => {
        const width = widths[column];
        if (width) cell.data = { ...cell.data, colwidth: width };
      });
    }
    children.splice(index, 1);
    index -= 1;
  }
}

export const tableColumnsRemark = $remark("anynoteTableColumns", () => () => (tree) => {
  applyColumnComments(tree as MarkdownNode);
});

function columnWidths(table: Node) {
  const widths: (number | null)[] = [];
  table.firstChild?.forEach((cell) => {
    const colwidth = cell.attrs.colwidth as number[] | null;
    widths.push(colwidth?.[0] ?? null);
  });
  return widths;
}

export const tableWithColumnsSchema = tableSchema.extendSchema((previous) => (ctx) => {
  const schema = previous(ctx);
  return {
    ...schema,
    toMarkdown: {
      match: schema.toMarkdown.match,
      runner: (state, node) => {
        const widths = columnWidths(node);
        if (widths.some(Boolean)) state.addNode("html", undefined, formatColumnsComment(widths));
        schema.toMarkdown.runner(state, node);
      },
    },
  };
});

function readColumnWidth(node: MarkdownNode) {
  const width = node.data?.colwidth;
  return typeof width === "number" ? [width] : null;
}

export const tableCellWithWidthSchema = tableCellSchema.extendSchema((previous) => (ctx) => {
  const schema = previous(ctx);
  return {
    ...schema,
    parseMarkdown: {
      match: schema.parseMarkdown.match,
      runner: (state, node, type) => {
        state
          .openNode(type, { alignment: node.align, colwidth: readColumnWidth(node as MarkdownNode) })
          .openNode(state.schema.nodes.paragraph)
          .next(node.children)
          .closeNode()
          .closeNode();
      },
    },
  };
});

export const tableHeaderWithWidthSchema = tableHeaderSchema.extendSchema((previous) => (ctx) => {
  const schema = previous(ctx);
  return {
    ...schema,
    parseMarkdown: {
      match: schema.parseMarkdown.match,
      runner: (state, node, type) => {
        state
          .openNode(type, { alignment: node.align, colwidth: readColumnWidth(node as MarkdownNode) })
          .openNode(state.schema.nodes.paragraph)
          .next(node.children)
          .closeNode()
          .closeNode();
      },
    },
  };
});
