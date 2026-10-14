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
  problems: string[];
}

/** Judges the element holding focus: on screen, with a drawn size, not hidden, and with a focus ring. */
function inspectFocus(): Stop | "body" {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return "body";
  const label = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} "${(
    el.getAttribute("aria-label") ??
    el.textContent ??
    ""
  )
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40)}"`;
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
  // The ring is the element's own outline, or one drawn by a part inside it (a Button's plate) or around it (a radio card).
  const drawn = (node: Element) => {
    const s = getComputedStyle(node);
    return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
  };
  let ring = drawn(el) || [...el.querySelectorAll("*")].some(drawn);
  for (let up = el.parentElement, i = 0; !ring && up && i < 3; up = up.parentElement, i++) {
    ring = drawn(up);
  }
  if (!ring) problems.push("no focus ring");
  return { label, problems };
}

/** What Tab can reach right now: visible, enabled, tabindex not negative, outside a closed dialog. */
function tabbableLabels(): string[] {
  const selector =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex], [contenteditable=true]";
  const out: string[] = [];
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
    out.push(
      `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} "${(
        el.getAttribute("aria-label") ??
        el.textContent ??
        ""
      )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 40)}"`,
    );
  }
  return out;
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
      const reachable = await page.evaluate(tabbableLabels);
      const { stops, wrapped } = await tabAround(page);

      expect(wrapped, `focus goes round within ${CAP} presses`).toBe(true);
      expect(stops.length, "the page has something to tab to").toBeGreaterThan(0);
      const bad = stops.filter((s) => s.problems.length > 0);
      expect(
        bad.map((s) => `${s.label}: ${s.problems.join(", ")}`),
        "focused elements that are hidden or ringless",
      ).toEqual([]);
      const reached = new Set(stops.map((s) => s.label));
      expect(
        reachable.filter((label) => !reached.has(label)),
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
