import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import displayFont from "@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff2?url";
import { ui } from "@/content";
import { Glass, Heading, STAGE_SCALE_SCRIPT, Text } from "@/design-system";
import { ArenaShell } from "@/shell/ArenaShell";
import { HEAD_FLAGS_SCRIPT } from "@/shell/headFlags";
import { ROUTES } from "@/shell/routes";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preload", href: displayFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  // The tab icon: the YS mark in the volt border. The .ico (16, 32 and 48 inside) is for older browsers, the .svg for modern ones.
  { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // The two inline scripts below run before React does and set attributes on <html> (STAGE_SCALE_SCRIPT: the
    // `--stage-scale` style; HEAD_FLAGS_SCRIPT: the `js` class and `data-return-visit`). React 19 would warn in
    // development that the server markup differs, so this one element is told to expect it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: STAGE_SCALE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: HEAD_FLAGS_SCRIPT }} />
        <Meta />
        <Links />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 bg-volt px-4 py-3 type-mono-md text-volt-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          {ui.skipToContent}
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ArenaShell>
      <Outlet />
    </ArenaShell>
  );
}

/** Last-resort page for render errors: no shell providers, so plain links and nothing that can throw again. */
export function ErrorBoundary() {
  const linkClass =
    "inline-flex h-11 items-center border border-line-strong px-3.5 type-mono-tag text-floodlight transition-colors hover:border-volt hover:text-volt";
  return (
    <main
      id="main"
      className="flex min-h-dvh items-center justify-center bg-ground px-(--gutter) py-10"
    >
      <Glass pad="lg" className="flex w-full max-w-180 flex-col gap-5">
        <Heading level={1} variant="d2">
          {ui.routes.notFound.heading}
        </Heading>
        <Text as="p" variant="body" tone="secondary">
          {ui.routes.notFound.description}
        </Text>
        <div className="flex flex-wrap gap-2">
          <a href={ROUTES.home} className={linkClass}>
            {ui.brand.wordmark}
          </a>
          <a href={ROUTES.scout} className={linkClass}>
            {ui.hud.quickView}
          </a>
        </div>
      </Glass>
    </main>
  );
}
