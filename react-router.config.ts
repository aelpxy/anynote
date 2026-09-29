import type { Config } from "@react-router/dev/config";

export default {
  // all workspace data is decrypted in the browser, so the app ships as static files served by the rust server
  ssr: false,
} satisfies Config;
