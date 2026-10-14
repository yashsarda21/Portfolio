// The build settings postbuild reads (VITE_FORM_ENDPOINT). Vite takes a `VITE_` setting from the process environment
// and also from `.env`, `.env.production` and `.env.local` files, so this reads them the same way: a value typed into
// a .env file must reach the page's policy, or the browser would block the form the page was built to post to.
import { loadEnv } from "vite";

/** Vite's `VITE_` settings for a production build in `root`, with the process environment winning (as in Vite). */
export function buildEnv(root, processEnv = process.env) {
  return { ...loadEnv("production", root, "VITE_"), ...processEnv };
}
