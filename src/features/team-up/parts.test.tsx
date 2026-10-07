import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { content, ui } from "@/content";
import { ArenaShell } from "@/shell/ArenaShell";
import { ChallengeForm, type TeamUpDeps } from "./ChallengeForm";
import { TeamUpPage } from "./TeamUpPage";
import { buildTeamUpView } from "./view";

const view = buildTeamUpView(content, ui);
const t = ui.pages.teamUp;

function deps(over: Partial<TeamUpDeps> = {}): TeamUpDeps {
  return {
    endpoint: null,
    fetch: vi.fn(() => Promise.resolve(new Response("{}", { status: 200 }))) as never,
    openUrl: vi.fn(),
    ...over,
  };
}

function renderPage(d: TeamUpDeps) {
  const router = createMemoryRouter([
    {
      path: "*",
      element: (
        <ArenaShell>
          <TeamUpPage view={view} deps={d} />
        </ArenaShell>
      ),
    },
  ]);
  return render(<RouterProvider router={router} />);
}

const name = () => screen.getByLabelText(view.fields.name.label);
const email = () => screen.getByLabelText(view.fields.email.label);
const message = () => screen.getByLabelText(view.fields.message.label);
const send = () => screen.getByRole("button", { name: view.send });

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(name(), "Sam Visitor");
  await user.type(email(), "sam@example.com");
  await user.type(message(), "We are hiring a full-stack engineer.");
}

/** A promise the test settles by hand: the "slow network". */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe("ChallengeForm: the formats", () => {
  it("is a group named by its legend with the three formats, the first chosen", () => {
    render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} />);
    const group = screen.getByRole("group", { name: view.formats.legend });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("value"))).toEqual(["sign", "doubles", "rally"]);
    expect(radios[0]).toBeChecked();
    expect(screen.getByRole("radio", { name: "DOUBLES" })).toHaveAccessibleDescription(
      "Let's build something together.",
    );
  });

  it("moves between the formats with the arrow keys, and clicking one chooses it", async () => {
    const user = userEvent.setup();
    render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} />);
    screen.getByRole("radio", { name: "SIGN A PLAYER" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "DOUBLES" })).toBeChecked();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "FRIENDLY RALLY" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "SIGN A PLAYER" }));
    expect(screen.getByRole("radio", { name: "SIGN A PLAYER" })).toBeChecked();
  });

  it("names the chosen format in the email's subject", async () => {
    const user = userEvent.setup();
    const d = deps();
    render(<ChallengeForm view={view} deps={d} onSent={() => {}} />);
    await user.click(screen.getByRole("radio", { name: "FRIENDLY RALLY" }));
    await fillIn(user);
    await user.click(send());
    const url = (d.openUrl as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(new URL(url).searchParams.get("subject")).toBe("FRIENDLY RALLY — Sam Visitor");
  });
});

describe("ChallengeForm: errors", () => {
  it("shows three errors, links each to its field, and focuses the name", async () => {
    const user = userEvent.setup();
    const d = deps();
    render(<ChallengeForm view={view} deps={d} onSent={() => {}} />);
    await user.click(send());

    for (const [field, text] of [
      [name(), t.errors.name],
      [email(), t.errors.email],
      [message(), t.errors.message],
    ] as const) {
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(field).toHaveAccessibleDescription(text);
    }
    expect(name()).toHaveFocus();
    expect(d.openUrl).not.toHaveBeenCalled();
    expect(d.fetch).not.toHaveBeenCalled();
  });

  it("focuses the first field that is wrong, in order", async () => {
    const user = userEvent.setup();
    render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} />);
    await user.type(name(), "Sam");
    await user.click(send());
    expect(email()).toHaveFocus();
    await user.type(email(), "sam@example.com");
    await user.click(send());
    expect(message()).toHaveFocus();
  });

  it("clears a field's error as it is fixed and leaves the others", async () => {
    const user = userEvent.setup();
    render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} />);
    await user.click(send());
    await user.type(name(), "Sam");
    expect(screen.queryByText(t.errors.name)).toBeNull();
    expect(name()).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText(t.errors.email)).toBeInTheDocument();
    expect(screen.getByText(t.errors.message)).toBeInTheDocument();
    // Half a fix is not a fix.
    await user.type(email(), "sam@example");
    expect(screen.getByText(t.errors.email)).toBeInTheDocument();
    await user.type(email(), ".com");
    expect(screen.queryByText(t.errors.email)).toBeNull();
  });

  it("does not shout about a field the visitor has not reached yet", async () => {
    const user = userEvent.setup();
    render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} />);
    await user.type(name(), "Sam");
    expect(screen.queryByText(t.errors.email)).toBeNull();
  });
});

describe("ChallengeForm: wiring", () => {
  it("posts natively to the email address, as plain text, until there is an endpoint", () => {
    const { container, rerender } = render(
      <ChallengeForm view={view} deps={deps()} onSent={() => {}} />,
    );
    const form = container.querySelector("form")!;
    expect(form).toHaveAttribute("action", `mailto:${view.address}`);
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("enctype", "text/plain");
    rerender(
      <ChallengeForm
        view={view}
        deps={deps({ endpoint: "https://forms.example/f/abc" })}
        onSent={() => {}}
      />,
    );
    expect(form).toHaveAttribute("action", "https://forms.example/f/abc");
    expect(form).not.toHaveAttribute("enctype");
  });

  it("turns the browser's own checks off once scripts run (ours replace them) but keeps the fields required", () => {
    const { container } = render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} />);
    expect(container.querySelector("form")).toHaveProperty("noValidate", true);
    for (const field of [name(), email(), message()]) expect(field).toBeRequired();
    expect(email()).toHaveAttribute("type", "email");
    expect(email()).toHaveAttribute("autocomplete", "email");
  });

  it("has an honeypot that is labelled, out of the tab order and never autofilled", () => {
    render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} />);
    const trap = screen.getByLabelText(view.honeypot);
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap).toHaveAttribute("autocomplete", "off");
    expect(trap.closest(".sr-only")).not.toBeNull();
  });

  it("offers the email address as a link, spelled as drawn", () => {
    render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} />);
    expect(screen.getByRole("link", { name: view.orEmail.label })).toHaveAttribute(
      "href",
      `mailto:${view.address}`,
    );
  });
});

describe("ChallengeForm: sending", () => {
  it("while it sends, the button says so, is aria-disabled, and a second press sends nothing more", async () => {
    const user = userEvent.setup();
    const slow = deferred<Response>();
    const fetchFn = vi.fn(() => slow.promise);
    const onSent = vi.fn();
    render(
      <ChallengeForm
        view={view}
        deps={deps({ endpoint: "https://forms.example/f/abc", fetch: fetchFn as never })}
        onSent={onSent}
      />,
    );
    await fillIn(user);
    await user.click(send());

    const busy = screen.getByRole("button", { name: view.sending });
    expect(busy).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("status")).toHaveTextContent(view.sending);
    // Enter in a field submits the form again: nothing goes out.
    await user.type(name(), "{Enter}");
    await user.click(busy);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await act(async () => slow.resolve(new Response("{}", { status: 200 })));
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("two submits in the same moment send once", async () => {
    const user = userEvent.setup();
    const d = deps();
    const { container } = render(<ChallengeForm view={view} deps={d} onSent={() => {}} />);
    await fillIn(user);
    const form = container.querySelector("form")!;
    await act(async () => {
      form.requestSubmit();
      form.requestSubmit();
    });
    expect(d.openUrl).toHaveBeenCalledTimes(1);
  });

  it("on an error keeps every word, says so with the email link, and lets the visitor try again", async () => {
    const user = userEvent.setup();
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response("no", { status: 500 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const onSent = vi.fn();
    render(
      <ChallengeForm
        view={view}
        deps={deps({ endpoint: "https://forms.example/f/abc", fetch: fetchFn as never })}
        onSent={onSent}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "DOUBLES" }));
    await fillIn(user);
    await user.click(send());

    expect(await screen.findByRole("alert")).toHaveTextContent(view.error);
    expect(onSent).not.toHaveBeenCalled();
    expect(name()).toHaveValue("Sam Visitor");
    expect(email()).toHaveValue("sam@example.com");
    expect(message()).toHaveValue("We are hiring a full-stack engineer.");
    expect(screen.getByRole("radio", { name: "DOUBLES" })).toBeChecked();
    expect(screen.getByRole("link", { name: view.orEmail.label })).toBeVisible();
    expect(send()).not.toHaveAttribute("aria-disabled");

    await user.click(send());
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("treats a network failure like any other error", async () => {
    const user = userEvent.setup();
    render(
      <ChallengeForm
        view={view}
        deps={deps({
          endpoint: "https://forms.example/f/abc",
          fetch: vi.fn(() => Promise.reject(new TypeError("offline"))) as never,
        })}
        onSent={() => {}}
      />,
    );
    await fillIn(user);
    await user.click(send());
    expect(await screen.findByRole("alert")).toHaveTextContent(view.error);
    expect(name()).toHaveValue("Sam Visitor");
  });

  it("a filled honeypot reads as sent and sends nothing", async () => {
    const user = userEvent.setup();
    const d = deps({ endpoint: "https://forms.example/f/abc" });
    const onSent = vi.fn();
    render(<ChallengeForm view={view} deps={d} onSent={onSent} />);
    await fillIn(user);
    await user.type(screen.getByLabelText(view.honeypot), "http://spam.example");
    await user.click(send());
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(d.fetch).not.toHaveBeenCalled();
  });

  it("puts the cursor in the name when asked to (after SEND ANOTHER)", () => {
    render(<ChallengeForm view={view} deps={deps()} onSent={() => {}} focusName />);
    expect(name()).toHaveFocus();
  });
});

describe("TeamUpPage", () => {
  it("replaces the form with the success panel: the heading has the cursor and the line is announced", async () => {
    const user = userEvent.setup();
    renderPage(deps());
    await fillIn(user);
    await user.click(send());

    const heading = await screen.findByRole("heading", { level: 2, name: view.success.title });
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByLabelText(view.fields.name.label)).toBeNull();
    // The status region the page keeps carries the line (the commentary bar is a picture of it).
    const statuses = screen.getAllByRole("status").map((s) => s.textContent);
    expect(statuses).toContain(view.success.comm);
    expect(screen.getByText(view.success.board.visitor)).toBeInTheDocument();
    expect(screen.getByText(view.success.board.home)).toBeInTheDocument();
  });

  it("SEND ANOTHER brings back an empty form with the cursor in the name", async () => {
    const user = userEvent.setup();
    renderPage(deps());
    await fillIn(user);
    await user.click(send());
    await user.click(await screen.findByRole("button", { name: view.success.again }));

    expect(name()).toHaveFocus();
    expect(name()).toHaveValue("");
    expect(email()).toHaveValue("");
    expect(message()).toHaveValue("");
    expect(screen.getByRole("radio", { name: "SIGN A PLAYER" })).toBeChecked();
    expect(screen.queryByRole("heading", { level: 2, name: view.success.title })).toBeNull();
  });

  it("pulses the floodlights once on success only", async () => {
    const user = userEvent.setup();
    const { container } = renderPage(deps());
    expect(container.querySelector(".animate-floodlight-pulse")).toBeNull();
    await fillIn(user);
    await user.click(send());
    await screen.findByRole("heading", { level: 2, name: view.success.title });
    expect(container.querySelectorAll(".animate-floodlight-pulse")).toHaveLength(1);
  });

  it("lists the four direct lines as same-tab links with a hidden arrow, then the after-you-send panel", () => {
    renderPage(deps());
    const lines = screen.getByRole("region", { name: view.skip });
    const links = within(lines).getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links.map((l) => l.getAttribute("href"))).toEqual(view.channels.map((c) => c.href));
    for (const link of links) {
      expect(link).not.toHaveAttribute("target");
      expect(link.querySelector("[aria-hidden='true']:not(svg)")).toHaveTextContent(
        ui.glyph.external,
      );
    }
    const panel = screen.getByRole("group", { name: view.after.label });
    expect(within(panel).getByText(view.after.board)).toBeInTheDocument();
  });
});
