import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArenaShell } from "@/shell/ArenaShell";
import { BUILD_YEAR } from "@/shell/config";
import { CardScreen } from "./CardPage";

describe("CardPage season", () => {
  afterEach(() => vi.useRealTimers());

  it("hydrates the prerendered HTML without a mismatch when the visitor's year is later than the build's", async () => {
    // The build: the HTML is rendered once, in the build's year.
    const html = renderToString(
      <MemoryRouter>
        <ArenaShell>
          <CardScreen />
        </ArenaShell>
      </MemoryRouter>,
    );
    expect(html).toContain(`SEASON ${BUILD_YEAR}`);

    // The visitor arrives a year later, so the client bundle is evaluated afresh in that year.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(BUILD_YEAR + 1, 5, 1));
    vi.resetModules();
    const { act } = await import("react");
    const { hydrateRoot } = await import("react-dom/client");
    const { MemoryRouter: ClientRouter } = await import("react-router");
    const { ArenaShell: ClientShell } = await import("@/shell/ArenaShell");
    const { CardScreen: ClientCard } = await import("./CardPage");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(
        container,
        <ClientRouter>
          <ClientShell>
            <ClientCard />
          </ClientShell>
        </ClientRouter>,
        { onRecoverableError: (e) => recoverable.push(e) },
      );
    });

    expect(recoverable).toEqual([]);
    // Once React has taken over, the card shows the visitor's own year.
    expect(container.textContent).toContain(`SEASON ${BUILD_YEAR + 1}`);
    await act(async () => root.unmount());
    container.remove();
  });
});
