import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import displayFont from "@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff2?url";
import { ui } from "@/content";
import { STAGE_SCALE_SCRIPT } from "@/design-system";
import { ArenaShell } from "@/shell/ArenaShell";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preload", href: displayFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: STAGE_SCALE_SCRIPT }} />
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
