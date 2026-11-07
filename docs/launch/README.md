# Launch checklist: the day Yash says "publish"

The site is **launch ready but not published** (owner decision, 2026-10-14). The host is **Cloudflare** (Workers static assets, with a `.dev` domain bought at Cloudflare). Cloudflare has never been called. This page is the whole recipe. It takes about 15 minutes with you at the keyboard.

**Read these two things first**

- `wrangler.jsonc` (how Cloudflare serves the files) and `public/_headers` (the security headers) have been tried only on a local Cloudflare test server (`wrangler dev`), **never on the real host**. Step 5 is how you verify them.
- The Team Up form's address rule (the page's security policy lets the form post to `VITE_FORM_ENDPOINT` and nowhere else) is **tested by unit tests only**. The browser tests run with no form address, so the first real submission after deploy is the first live check of it (step 5, last bullet).

## Before the day: two checks only you can do

| Check | File | Time |
|---|---|---|
| Listen to the site with VoiceOver | [`screen-reader-checklist.md`](./screen-reader-checklist.md) | about 10 minutes |
| Read the words we wrote ourselves and mark changes | [`copy-review.md`](./copy-review.md) | about 20 minutes |

Anything you mark comes back to me as one follow-up task. Do these before step 1 so the live site has your final words.

## The steps

### 1. Put the code on GitHub

The code is already on GitHub. Make sure the branch you want live (usually `main`) has the Cloudflare files (`wrangler.jsonc`, `public/_headers`, `.node-version`), and that CI (`.github/workflows/ci.yml`) is green.

### 2. Buy the domain and import the repository in Cloudflare

1. In the Cloudflare dashboard, open **Domain Registration, Register Domains** (Cloudflare Registrar) and buy your `.dev` domain.
2. Open **Workers & Pages**, then **Create**, then **Import a repository**, and pick the repository.
3. Build settings:
   - Build command: `pnpm build`
   - Deploy command: `npx wrangler deploy`
   - Leave the project name as `portfolio` (it must match `name` in `wrangler.jsonc`).
4. `wrangler.jsonc` tells Cloudflare to serve the `build/client` folder with no Worker script, to send `404.html` with status 404 for a wrong address, and to drop trailing slashes (`/arena`, never `/arena/`). `public/_headers` carries the security headers (the build copies it into `build/client`).
5. Node: `.node-version` says `22`. Only if the build uses the wrong Node, add the build variable `NODE_VERSION` = `22`. Pnpm: Cloudflare takes the version from `packageManager` in `package.json`. If the install step complains about the pnpm version, add the build variable `PNPM_VERSION` with the same number as `packageManager`.

### 3. Set the settings (the project, Settings, Variables and Secrets; they must be build variables)

| Name | Value | Needed? |
|---|---|---|
| `VITE_SITE_URL` | The final address, https only, e.g. `https://yash.dev` | Yes. Without it the site builds but has no canonical link, no share-image address and an empty sitemap. |
| `VITE_FORM_ENDPOINT` | The form service's https address (Formspree style) | Optional. Without it the Team Up form opens the visitor's email app instead. |

Both are read **at build time**, so changing either one means a new deploy. (On your own Mac they can also sit in a `.env` file in the project folder; the build reads that file too, including for the form's security policy.)

### 4. Deploy

Save and deploy. Cloudflare runs `pnpm build`, which is `react-router build` and then `tools/postbuild.mjs` (it writes `404.html`, the file the host sends with status 404 for every wrong address, found through `not_found_handling` in `wrangler.jsonc`, and adds each page's security policy with the exact hash of its inline scripts). Then `npx wrangler deploy` uploads `build/client`.

### 5. Check the live site

Use the real address, and do these in order.

- [ ] **A wrong address is a real 404.** Open `<site>/nope`. You should see OUT OF BOUNDS once (one page, not two stacked), with a line "You tried /nope", and the browser's developer tools (Network tab) should show status **404**, not 200. If it shows 200, the host is serving the fallback page: tell me, do not ignore it.
- [ ] **The headers match what we planned** (they come from `public/_headers`). Reload any page and open the Network tab, click the page, then Headers. Look for:
  - `Content-Security-Policy: frame-ancestors 'none'; upgrade-insecure-requests`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - and on any file under `/assets/`: `Cache-Control: public, max-age=31536000, immutable`

  The page's own policy (`default-src 'self'; script-src ...`) is **not** a header: it is a `<meta>` tag inside each page's `<head>`. Also check that `<site>/arena/` jumps to `<site>/arena` (no trailing slash). Also open the browser console on the Landing, the Hub and a game: there must be **no red "Content Security Policy" lines**. (That is how a wrong script hash shows up.)
- [ ] **The share preview.** Paste the address into LinkedIn's Post Inspector (https://www.linkedin.com/post-inspector/). You should see the 1200x630 card: your cutout, YASH SARDA, your role line, THE ARENA. If you see an old or missing card, press "Inspect" again (LinkedIn caches).
- [ ] **`<site>/sitemap.xml` and `<site>/robots.txt`.** The sitemap lists every public page with your address (not `arena.example`) and must **not** list `/404`, `/arena/giant-killer` or `/locker-room`. `robots.txt` ends with a `Sitemap:` line pointing at it.
- [ ] **Lighthouse on the live address.** In Chrome DevTools, Lighthouse tab, mobile, on `/`, `/scout` and `/arena`. We gate phones at 80; expect 90 or more. A lower live number than our local one is normal if the host is slow to reply; a number below 80 is worth telling me about.
- [ ] **Safari and the phone.** Open the live site in Safari and on your phone, and play one game to the end.
- [ ] **The form (only if you set `VITE_FORM_ENDPOINT`).** Send one real message from Team Up. It must say it was sent, and the console must show no Content Security Policy line. If the form is blocked by the policy, the form service's address is not what we expected: tell me.

### 6. The custom domain

1. **Check the subdomains first.** The site's `Strict-Transport-Security` header has `includeSubDomains` and lasts two years, so browsers force https on *every* subdomain of the domain for two years. A `.dev` domain is already on the browsers' built-in HTTPS-only list, so https is forced anyway and this warning matters much less. If any subdomain must stay on plain http (it cannot, on `.dev`), tell me.
2. In Cloudflare, open the project, **Settings, Domains & Routes, Add, Custom domain**, and enter your domain. Because you bought it at Cloudflare, the DNS record is made for you.
3. Set `VITE_SITE_URL` to `https://<your domain>`.
4. **Deploy again** (the project, Deployments, or push a new commit). The address is baked into the pages at build time, so without a new deploy the canonical link, the share image address and the sitemap show the wrong address.
5. Repeat the share-preview and sitemap checks in step 5.

## If something is wrong

- **The page is blank and the console shows a Content Security Policy error:** a page's inline script no longer matches its hash. Rebuild (`pnpm build`) rather than editing `build/client` by hand, because the hashes are made by `tools/postbuild.mjs`.
- **Headers missing:** check that `public/_headers` exists and that `build/client/_headers` is there after the build.
- **A wrong address shows 200 instead of 404:** check `not_found_handling` is `"404-page"` in `wrangler.jsonc` and that `build/client/404.html` exists.
- **To undo a deploy:** in Cloudflare, the project, Deployments, pick an earlier version and roll back to it.

## Checking the site on your own Mac before launch

Run `pnpm build` and then `pnpm preview`, and open **http://127.0.0.1:4173**. This works in Safari too (the "upgrade insecure requests" rule is in the host headers, so it only applies on the live https site and does not break the local http preview). Use this address for the Safari and VoiceOver checks.

## Words used here

- **CSP (Content Security Policy):** a list the page gives the browser of where its scripts, images and forms may come from. Anything not on the list is blocked.
- **Hash (of a script):** a fingerprint of the exact text of a script. The policy lists the fingerprints of the page's own inline scripts, so only those run.
- **Header:** a note the server sends with a page, before the page itself, that tells the browser how to treat it (for example "never show this in a frame").
- **HSTS (Strict-Transport-Security):** a header that tells the browser "only ever use https for this site".
- **Canonical link:** a tag that tells search engines the one true address of a page.
- **Env variable (environment variable):** a setting given to the build from outside the code. Ours start with `VITE_` so the build can read them.
- **CI (continuous integration):** GitHub running all our checks automatically after each push.
- **Wrangler:** Cloudflare's command line tool. `npx wrangler deploy` uploads the built site; `wrangler dev` runs a local test copy of the host.
