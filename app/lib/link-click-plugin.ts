import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { $prose } from "@milkdown/kit/utils";

export function createLinkClickPlugin(openLink: (href: string) => void) {
  return $prose(
    () =>
      new Plugin({
        key: new PluginKey("link-click"),
        props: {
          handleClick(_view, _pos, event) {
            if (!(event.metaKey || event.ctrlKey)) return false;

            const link =
              event.target instanceof Element
                ? event.target.closest("a[href]")
                : null;
            const href = link?.getAttribute("href");
            if (!href || link?.classList.contains("heading-anchor")) {
              return false;
            }

            openLink(href);
            return true;
          },
        },
      }),
  );
}
