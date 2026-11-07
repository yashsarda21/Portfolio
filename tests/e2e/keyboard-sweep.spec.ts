import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { waitForFiniteAnimations } from "../support/animations";
import { waitForHydration } from "./support/contentPage";
import { ALL_PATHS } from "./support/matchday";

/** Most Tab presses a page may take before focus has gone round (a page with more than this is a finding). */
const CAP = 80;

interface Stop {
  /** A readable name for the failure message. */
  label: string;
  /** The `data-sweep-id` the census stamped on the element (null for a stop the census did not list). */
  id: string | null;
  problems: string[];
}

interface Tabbable {
  id: string;
  label: string;
}

type SweepWindow = Window & {
  /** The element's outline signature (its own, its parts', and its three nearest ancestors'): what a focus ring changes. */
  __ring: (el: Element) => string;
  /** The signature of each element before it had focus, by `data-sweep-id`. */
  __ringOff: Record<string, string>;
};

/**
 * What Tab can reach right now: visible, enabled, tabindex not negative, outside a closed dialog. Each is stamped
 * with a `data-sweep-id` (so two controls with the same label are two stops, not one), and its ring is recorded
 * while nothing has focus, so a stop can be compared with its own unfocused self.
 */
function censusTabbables(): Tabbable[] {
  const win = window as unknown as SweepWindow;
  const outline = (node: Element) => {
    const s = getComputedStyle(node);
    return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0
      ? `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`
      : "-";
  };
  win.__ring = (el) => {
    const parts = [outline(el), ...[...el.querySelectorAll("*")].map(outline)];
    for (let up = el.parentElement, i = 0; up && i < 3; up = up.parentElement, i++) {
      parts.push(outline(up));
    }
    return parts.join("|");
  };
  win.__ringOff = {};
  const labelOf = (el: Element) =>
    `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} "${(
      el.getAttribute("aria-label") ??
      el.textContent ??
      ""
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40)}"`;
  const selector =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex], [contenteditable=true]";
  const out: Tabbable[] = [];
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if (el.matches(":disabled") || el.tabIndex < 0) continue;
    if (el.closest("[inert], dialog:not([open])")) continue;
    // A tab list hands focus on to its selected tab (Radix roving focus): the tab is the stop.
    if (el.getAttribute("role") === "tablist") continue;
    if (!el.checkVisibility({ visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    // Only the checked radio of a group takes Tab; the others are reached with the arrow keys.
    if (el instanceof HTMLInputElement && el.type === "radio") {
      const group = el.name
        ? [...document.querySelectorAll<HTMLInputElement>(`input[type=radio][name="${el.name}"]`)]
        : [el];
      const checked = group.find((r) => r.checked);
      if (checked && checked !== el) continue;
      if (!checked && group[0] !== el) continue;
    }
    const id = String(out.length);
    el.dataset.sweepId = id;
    win.__ringOff[id] = win.__ring(el);
    out.push({ id, label: labelOf(el) });
  }
  return out;
}

/** Judges the element holding focus: on screen, with a drawn size, not hidden, and with a focus ring that its unfocused self lacked. */
function inspectFocus(): Stop | "body" {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return "body";
  const win = window as unknown as SweepWindow;
  const label = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} "${(
    el.getAttribute("aria-label") ??
    el.textContent ??
    ""
  )
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40)}"`;
  const id = el.getAttribute("data-sweep-id");
  const problems: string[] = [];
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  if (style.visibility === "hidden") problems.push("visibility:hidden");
  if (rect.width <= 0 || rect.height <= 0) problems.push("zero size");
  const inView =
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth;
  if (!inView) problems.push("outside the viewport");
  // The ring appears on focus: the outlines around the element (its own, a part inside it such as a Button's plate,
  // or one around it such as a radio card) are not what they were before it had focus. A permanent outline is not a ring.
  const off = id === null ? undefined : win.__ringOff[id];
  const on = win.__ring(el);
  // A video with native controls keeps `activeElement` on the video while Tab walks the browser's own buttons inside
  // it (play, time, mute, full screen, more), and the browser draws their ring in its shadow tree, out of reach of
  // computed style. The recording is the owner's, 2026-11-07: those stops are the browser's to judge.
  if (el instanceof HTMLVideoElement && el.controls) return { label, id, problems };
  if (on === "-" || on.split("|").every((part) => part === "-")) problems.push("no focus ring");
  else if (off !== undefined && off === on) problems.push("the outline is the same without focus");
  return { label, id, problems };
}

/** Tabs from the top of the page until focus has gone round once. Returns what held focus, press by press. */
async function tabAround(page: Page) {
  // Start from the top of the document, as a visitor arriving on the page does.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const stops: Stop[] = [];
  let wrapped = false;
  for (let press = 1; press <= CAP; press++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(inspectFocus);
    if (stop === "body") {
      wrapped = true;
      break;
    }
    stops.push(stop);
  }
  return { stops, wrapped };
}

test.describe("keyboard sweep (1440x900)", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    void browserName;
    test.skip(testInfo.project.name !== "desktop", "the phone has its own check below");
  });

  for (const { name, path } of ALL_PATHS) {
    test(`${name} (${path}): every stop is visible with a ring, none lost, all reached`, async ({
      page,
    }) => {
      await page.goto(path);
      await waitForHydration(page);
      await waitForFiniteAnimations(page);
      const reachable = await page.evaluate(censusTabbables);
      const { stops, wrapped } = await tabAround(page);

      expect(wrapped, `focus goes round within ${CAP} presses`).toBe(true);
      expect(stops.length, "the page has something to tab to").toBeGreaterThan(0);
      const bad = stops.filter((s) => s.problems.length > 0);
      expect(
        bad.map((s) => `${s.label}: ${s.problems.join(", ")}`),
        "focused elements that are hidden or ringless",
      ).toEqual([]);
      const reached = new Set(stops.map((s) => s.id));
      expect(
        reachable.filter(({ id }) => !reached.has(id)).map(({ label }) => label),
        "tabbable elements Tab never reached",
      ).toEqual([]);
    });
  }
});

test.describe("index drawer by keyboard (390x844)", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    void browserName;
    test.skip(testInfo.project.name !== "mobile", "the drawer is the phone's");
  });

  test("Enter opens it, Tab stays inside, Esc closes it and focus returns to INDEX", async ({
    page,
  }) => {
    await page.goto("/arena");
    await waitForHydration(page);
    await waitForFiniteAnimations(page);
    const index = page.getByRole("button", { name: ui.hub.drawer.open, exact: true });
    await index.focus();
    await expect(index).toBeFocused();
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog", { name: ui.hub.index.label });
    await expect(drawer).toBeVisible();
    // Round the drawer both ways, more than twice. Tab past the last control hops to the browser's own bar (the
    // document reads as the body); what it must never do is land on the page behind.
    for (const key of ["Tab", "Shift+Tab"]) {
      for (let press = 1; press <= 24; press++) {
        await page.keyboard.press(key);
        const where = await page.evaluate(() =>
          document.activeElement === document.body
            ? "body"
            : document.activeElement?.closest("dialog[data-drawer][open]")
              ? "drawer"
              : `page: ${document.activeElement?.tagName} ${document.activeElement?.textContent?.slice(0, 30)}`,
        );
        expect(["drawer", "body"], `${key} press ${press} (${where})`).toContain(where);
      }
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(index).toBeFocused();
  });
});
