import type { Config } from "@react-router/dev/config";

// Static site: every route is pre-rendered to HTML at build time (spec §4.3).
export default {
  ssr: false,
  prerender: true,
} satisfies Config;
