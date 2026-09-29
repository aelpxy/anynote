import { imageSchema } from "@milkdown/kit/preset/commonmark";

const widthSuffix = /\|(\d{2,4})$/;
const minStoredWidth = 40;

export function splitAltWidth(alt: string) {
  const match = widthSuffix.exec(alt);
  const width = match ? Number(match[1]) : 0;
  return match && width >= minStoredWidth
    ? { alt: alt.slice(0, match.index), width }
    : { alt, width: null };
}

// milkdown passes null for images without a title, which prosemirror rejects and drops the image
export const nullSafeImageSchema = imageSchema.extendSchema((previous) => (ctx) => {
  const schema = previous(ctx);
  return {
    ...schema,
    attrs: { ...schema.attrs, width: { default: null } },
    parseMarkdown: {
      match: schema.parseMarkdown.match,
      runner: (state, node, type) => {
        const { alt, width } = splitAltWidth(typeof node.alt === "string" ? node.alt : "");
        state.addNode(type, {
          src: typeof node.url === "string" ? node.url : "",
          alt,
          title: typeof node.title === "string" ? node.title : "",
          width,
        });
      },
    },
    toMarkdown: {
      match: schema.toMarkdown.match,
      runner: (state, node) => {
        const { src, alt, title, width } = node.attrs;
        state.addNode("image", undefined, undefined, {
          url: src,
          alt: width ? `${alt}|${width}` : alt,
          title: title || null,
        });
      },
    },
  };
});
