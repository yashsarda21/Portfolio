import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { withShell } from "@/shell/storyDecorators";
import { artboardTeamUpView } from "./TeamUpPage.fixture";
import type { TeamUpDeps } from "./ChallengeForm";
import { TeamUpPage, TeamUpScreen } from "./TeamUpPage";

const meta: Meta = {
  title: "Features/TeamUp",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

const view = artboardTeamUpView;
const ENDPOINT = "https://forms.example/f/arena";

/** Sends that stand in for the network: nothing here leaves the story. */
const sendsByEmail: TeamUpDeps = {
  endpoint: null,
  fetch: () => Promise.reject(),
  openUrl: () => {},
};
const accepted: TeamUpDeps = {
  endpoint: ENDPOINT,
  fetch: () => Promise.resolve(new Response("{}", { status: 200 })),
  openUrl: () => {},
};
const never: TeamUpDeps = {
  endpoint: ENDPOINT,
  fetch: () => new Promise(() => {}),
  openUrl: () => {},
};
const refused: TeamUpDeps = {
  endpoint: ENDPOINT,
  fetch: () => Promise.resolve(new Response("no", { status: 500 })),
  openUrl: () => {},
};

/** A valid challenge, typed the way a visitor would, ready to send. */
async function fillIn(canvas: ReturnType<typeof within>) {
  await userEvent.type(canvas.getByLabelText(view.fields.name.label), "Sam Visitor");
  await userEvent.type(canvas.getByLabelText(view.fields.email.label), "sam@example.com");
  await userEvent.type(
    canvas.getByLabelText(view.fields.message.label),
    "We are hiring a full-stack engineer.",
  );
}

/** The real page, built from content. It sends by email: no form service is set. */
export const RealContent: StoryObj = { render: () => <TeamUpScreen /> };

/** The artboard's own copy, the form idle, compared pixel-for-pixel with Team-Up. */
export const ArtboardParity: StoryObj = {
  render: () => <TeamUpPage view={view} deps={sendsByEmail} />,
};

/** Send with nothing filled in: three errors, each linked to its field, the cursor in the first. */
export const Errors: StoryObj = {
  render: () => <TeamUpPage view={view} deps={sendsByEmail} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: view.send }));
    await expect(await canvas.findByText(view.errors.name)).toBeVisible();
    await expect(canvas.getByLabelText(view.fields.name.label)).toHaveFocus();
  },
};

/** The form service is slow: the button reads SENDING… and cannot be pressed again. */
export const Sending: StoryObj = {
  render: () => <TeamUpPage view={view} deps={never} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillIn(canvas);
    await userEvent.click(canvas.getByRole("button", { name: view.send }));
    await expect(await canvas.findByRole("button", { name: view.sending })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};

/** No form service: the email app is asked to open. Nothing is sent yet, so the form stays with the note and COPY MESSAGE. */
export const MailtoOpened: StoryObj = {
  render: () => <TeamUpPage view={view} deps={sendsByEmail} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillIn(canvas);
    await userEvent.click(canvas.getByRole("button", { name: view.send }));
    await expect(await canvas.findByText(view.mailto.note)).toBeVisible();
    await expect(canvas.getByRole("button", { name: view.mailto.copy })).toBeVisible();
    await expect(canvas.getByLabelText(view.fields.name.label)).toHaveValue("Sam Visitor");
  },
};

/** The challenge is in (the form service took it): the heading has the cursor, the line, the fixture and a way to send another. */
export const Success: StoryObj = {
  render: () => <TeamUpPage view={view} deps={accepted} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillIn(canvas);
    await userEvent.click(canvas.getByRole("button", { name: view.send }));
    await expect(
      await canvas.findByRole("heading", { level: 2, name: view.success.title }),
    ).toHaveFocus();
  },
};

/** The form service answers with an error: the line says so, the words stay, the email address is offered. */
export const SendError: StoryObj = {
  render: () => <TeamUpPage view={view} deps={refused} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillIn(canvas);
    await userEvent.click(canvas.getByRole("button", { name: view.send }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent(view.error);
    await expect(canvas.getByLabelText(view.fields.name.label)).toHaveValue("Sam Visitor");
  },
};
