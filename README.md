# Arena: Yash Sarda's portfolio

A broadcast-style portfolio: visitors "play" three short games against Yash and read his career as a scorecard. React Router (prerendered, no server), React 19, Vite, Tailwind, Storybook, Vitest, Playwright, Lighthouse.

## Commands

| Command                          | What it does                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                       | Dev server                                                                                                      |
| `pnpm build` then `pnpm preview` | Production build, served at http://127.0.0.1:4173                                                               |
| `pnpm verify`                    | The whole gate: typecheck, lint, format, unit tests, references, Storybook build, story tests, end-to-end tests |
| `pnpm lighthouse`                | Lighthouse budgets on a production build                                                                        |

The design brief is `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`.

## Launch

The site is launch ready but **not published yet** (owner decision, 2026-10-14). When it is time, follow [`docs/launch/README.md`](docs/launch/README.md): a plain step-by-step for GitHub, Vercel, the two settings (`VITE_SITE_URL`, `VITE_FORM_ENDPOINT`) and the checks to run on the live site. Two checks need a human first: [`docs/launch/screen-reader-checklist.md`](docs/launch/screen-reader-checklist.md) and [`docs/launch/copy-review.md`](docs/launch/copy-review.md).
