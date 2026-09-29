import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { $prose } from "@milkdown/kit/utils";

function hasImageFile(data: DataTransfer) {
  return Array.from(data.files).some((file) => file.type.startsWith("image/"));
}

function hasText(html: string) {
  const body = new DOMParser().parseFromString(html, "text/html").body;
  return (body.textContent ?? "").trim().length > 0;
}

// office apps put a picture of the copied text next to its html, so text wins over that picture;
// html that is only an image (like "copy image" in a browser) falls through to the upload plugin
export const imagePastePlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey("anynote-image-paste"),
      props: {
        handlePaste(view, event) {
          const data = event.clipboardData;
          const html = data?.getData("text/html");
          if (!data || !html || !hasImageFile(data) || !hasText(html)) return false;
          // without the event the paste pipeline sees no files, so it pastes the html normally
          view.pasteHTML(html);
          return true;
        },
      },
    }),
);
