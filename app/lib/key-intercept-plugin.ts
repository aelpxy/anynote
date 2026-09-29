import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { $prose } from "@milkdown/kit/utils";

export type KeyInterceptor = (event: KeyboardEvent) => boolean;

export function createKeyInterceptPlugin(interceptorRef: { current: KeyInterceptor | null }) {
  return $prose(
    () =>
      new Plugin({
        key: new PluginKey("anynote-key-intercept"),
        props: {
          handleDOMEvents: {
            keydown: (_view, event) => {
              if (!interceptorRef.current?.(event)) return false;
              event.preventDefault();
              return true;
            },
          },
        },
      }),
  );
}
