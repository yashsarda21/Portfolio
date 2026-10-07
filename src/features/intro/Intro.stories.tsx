import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { expect, within } from "storybook/test";
import { loadGsap } from "@/lib/motion";
import { withShell } from "@/shell/storyDecorators";
import { artboardIntroView } from "./intro.fixture";
import { IntroPage } from "./IntroPage";
import { collectIntroRefs } from "./refs";
import { showIntroEndState } from "./timeline";
import { useIntroTimeline } from "./useIntroTimeline";

const meta: Meta = {
  title: "Features/Intro",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The page at the end of the show: the story puts every part where the timeline would leave it, instead of playing. */
function EndState() {
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let live = true;
    void loadGsap().then((gsap) => {
      const root = rootRef.current;
      if (!live || !root) return;
      showIntroEndState(gsap, collectIntroRefs(root));
      root.setAttribute("data-intro", "done");
    });
    return () => {
      live = false;
    };
  }, []);
  return <IntroPage view={artboardIntroView} rootRef={rootRef} />;
}

/** The artboard's own copy, at the end of the show. */
export const Desktop: StoryObj = {
  render: () => <EndState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "Yash Sarda" })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: /ENTER THE ARENA/ })).toHaveAttribute(
      "href",
      "/arena",
    );
    await expect(canvas.getByRole("link", { name: /SKIP INTRO/ })).toHaveAttribute(
      "href",
      "/arena",
    );
  },
};

/** Compared pixel-for-pixel with the Intro artboard at 1440x900 (same masks as the route). */
export const ArtboardParity: StoryObj = {
  render: () => <EndState />,
};

/** The head script's `.js` flag, which the page needs for its held-back parts to be held back (the app sets it before first paint). */
function ScriptFlag({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    return () => root.classList.remove("js");
  }, []);
  return <>{children}</>;
}
const withScript: Decorator = (Story) => (
  <ScriptFlag>
    <Story />
  </ScriptFlag>
);

function Live() {
  const rootRef = useRef<HTMLElement>(null);
  const { replay } = useIntroTimeline(rootRef, { onComm: () => {} });
  return <IntroPage view={artboardIntroView} rootRef={rootRef} onReplay={replay} />;
}

/** The real hook, for eyeballing: plays on load, REPLAY plays it again. Not axe-checked (see tests/stories/a11y.spec.ts); the route's e2e checks the end. */
export const Playing: StoryObj = {
  decorators: [withScript],
  render: () => <Live />,
};
