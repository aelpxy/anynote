import { imageSchema } from "@milkdown/kit/preset/commonmark";

// milkdown passes null for images without a title, which prosemirror rejects and drops the image
export const nullSafeImageSchema = imageSchema.extendSchema((previous) => (ctx) => {
  const schema = previous(ctx);
  return {
    ...schema,
    parseMarkdown: {
      match: schema.parseMarkdown.match,
      runner: (state, node, type) => {
        state.addNode(type, {
          src: typeof node.url === "string" ? node.url : "",
          alt: typeof node.alt === "string" ? node.alt : "",
          title: typeof node.title === "string" ? node.title : "",
        });
      },
    },
  };
});
