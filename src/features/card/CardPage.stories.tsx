import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { withShell } from "@/shell/storyDecorators";
import { artboardCardView } from "./CardPage.fixture";
import { CardPage, CardScreen } from "./CardPage";

const meta: Meta = {
  title: "Features/Card",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The real page, built from content: no public PDF yet, so the volt row is the email request. */
export const RealContent: StoryObj = { render: () => <CardScreen /> };

/** The artboard's own copy (both PDF rows, SEASON 2026), compared pixel-for-pixel with Player-Card. */
export const ArtboardParity: StoryObj = {
  render: () => <CardPage view={artboardCardView} liveYear={false} />,
};

/** The back of the card: the section index. Flipped through the card's own button. */
export const Flipped: StoryObj = {
  render: () => <CardPage view={artboardCardView} liveYear={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [flip] = await canvas.findAllByRole("button", {
      name: artboardCardView.flip.toBack,
    });
    await userEvent.click(flip!);
    await expect(
      await canvas.findByRole("button", { name: artboardCardView.flip.toFront }),
    ).toBeVisible();
  },
};
