import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.API_URL ?? "http://127.0.0.1:8080",
        xfwd: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "@serenity-kit/opaque",
      "libsodium-wrappers-sumo",
      "@codemirror/commands",
      "@codemirror/language",
      "@codemirror/language-data",
      "@codemirror/state",
      "@codemirror/view",
      "@lezer/highlight",
      "@milkdown/kit/component/code-block",
      "@milkdown/kit/core",
      "@milkdown/kit/plugin/clipboard",
      "@milkdown/kit/plugin/cursor",
      "@milkdown/kit/plugin/history",
      "@milkdown/kit/plugin/listener",
      "@milkdown/kit/plugin/trailing",
      "@milkdown/kit/plugin/upload",
      "@milkdown/kit/preset/commonmark",
      "@milkdown/kit/preset/gfm",
      "@milkdown/kit/prose",
      "@milkdown/kit/prose/commands",
      "@milkdown/kit/prose/state",
      "@milkdown/kit/prose/tables",
      "@milkdown/kit/prose/view",
      "@milkdown/kit/utils",
      "@milkdown/react",
    ],
  },
});
