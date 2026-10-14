import { ui } from "@/content";
import { Button, MonoLabel, Scoreboard } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { ContentPage } from "@/shell/ContentPage";
import { ROUTES } from "@/shell/routes";
import { buildNotFoundView, type NotFoundView } from "./view";

/**
 * OUT OF BOUNDS: the content-page frame (brand and QUICK VIEW on top), the scoreboard with the path the visitor
 * tried, and the three ways back. A pure view of a NotFoundView.
 */
export function NotFoundPage({ view }: { view: NotFoundView }) {
  return (
    <ContentPage route="notFound" trail={[]} eyebrow={ui.brand.wordmark} lede={view.description}>
      <Scoreboard size="compact" className="w-full max-w-180">
        <Scoreboard.Body className="gap-6 px-5.5 py-10">
          {view.tried ? (
            <MonoLabel variant="mono-code" tone="volt" className="text-center break-all">
              {view.tried}
            </MonoLabel>
          ) : null}
          <div className="flex w-full flex-wrap items-center justify-center gap-4 max-md:flex-col">
            {view.links.map((link) => (
              <Button
                key={link.id}
                as={ArenaLink}
                to={link.to}
                size="s"
                variant={link.id === "hub" ? "primary" : "secondary"}
              >
                {link.label}
              </Button>
            ))}
          </div>
        </Scoreboard.Body>
      </Scoreboard>
    </ContentPage>
  );
}

// The page says the same thing to everyone, so the /404 view is built once.
const plain = buildNotFoundView(ui, ROUTES);

/** The page for `/404` itself (nothing was tried) or, with `path`, for an unknown address. */
export function NotFoundScreen({ path }: { path?: string }) {
  return <NotFoundPage view={path ? buildNotFoundView(ui, ROUTES, path) : plain} />;
}
