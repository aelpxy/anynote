import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";

export function createViewBridgePlugin(onChange: (view: EditorView) => void) {
  return $prose(
    () =>
      new Plugin({
        key: new PluginKey("view-bridge"),
        view(view) {
          onChange(view);
          return { update: onChange };
        },
        props: {
          handleDOMEvents: {
            focus(view) {
              onChange(view);
              return false;
            },
            blur(view) {
              onChange(view);
              return false;
            },
          },
        },
      }),
  );
}
