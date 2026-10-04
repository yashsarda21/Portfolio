import { describe, expect, it } from "vitest";
import { content, ui, type Content } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildTrophiesView } from "./view";

const build = (c: Content = content) => buildTrophiesView(c, ui, ROUTES);

/** The same content with a second cup unlocked before the locked one: nothing may assume a fixed count. */
const extended = (): Content => {
  const [cup, ...rest] = content.trophyRoom;
  return {
    ...content,
    trophyRoom: [cup!, { ...cup!, title: "Second Cup" }, ...rest],
  } as Content;
};

describe("buildTrophiesView", () => {
  it("lists the trophies in content order, the locked one last", () => {
    const { trophies } = build();
    expect(trophies.map((t) => t.kind)).toEqual([
      "cup",
      "medal",
      "plaque",
      "pennant",
      "round",
      "locked",
    ]);
    expect(trophies.map((t) => t.title)).toEqual(content.trophyRoom.map((t) => t.title));
    expect(trophies.map((t) => t.locked)).toEqual([false, false, false, false, false, true]);
  });

  it("gives every trophy its own id", () => {
    const ids = build(extended()).trophies.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("the locked trophy has no detail; the others do", () => {
    const { trophies } = build();
    expect(trophies.at(-1)!.detail).toBeNull();
    for (const t of trophies.slice(0, -1)) expect(t.detail).not.toBeNull();
  });

  it("numbers the plinth panels n / 5: the locked trophy is not counted", () => {
    const indexes = build().trophies.map((t) => t.detail?.index ?? null);
    expect(indexes).toEqual(["1 / 5", "2 / 5", "3 / 5", "4 / 5", "5 / 5", null]);
  });

  it("counts whatever is unlocked", () => {
    const indexes = build(extended())
      .trophies.map((t) => t.detail?.index)
      .filter(Boolean);
    expect(indexes).toEqual(["1 / 6", "2 / 6", "3 / 6", "4 / 6", "5 / 6", "6 / 6"]);
  });

  it("the shelf shows the short sub where there is one; the panel the full sub", () => {
    const medal = build().trophies[1]!;
    expect(medal.shelfSub).toBe("MHT-CET 2020 · State Rank 709");
    expect(medal.detail!.sub).toBe("MHT-CET 2020 · State Merit Rank 709");
    // No short sub: the shelf falls back to the full one.
    const cup = build().trophies[0]!;
    expect(cup.shelfSub).toBe(cup.detail!.sub);
    expect(cup.shelfSub).toBe("LeetCode · Codeforces · CodeChef");
  });

  it("the panel carries the title and description from content", () => {
    const plaque = build().trophies[2]!;
    expect(plaque.detail!.title).toBe("Published Research");
    expect(plaque.detail!.description).toBe(content.trophyRoom[2]!.description);
  });

  it("the cup links to LeetCode, Codeforces and CodeChef with the content hrefs", () => {
    const cup = build().trophies[0]!;
    expect(cup.detail!.links).toEqual([
      { label: "LEETCODE", href: "https://leetcode.com/u/yash_sarda" },
      { label: "CODEFORCES", href: "https://codeforces.com/profile/yashsarda2002" },
      { label: "CODECHEF", href: "https://www.codechef.com/users/yash0721" },
    ]);
    expect(build().trophies[1]!.detail!.links).toEqual([]);
  });

  it("draws the medal's figure from its title and the plaque's word from the copy", () => {
    const { trophies } = build();
    expect(trophies[1]!.label).toBe("99.5");
    expect(trophies[2]!.label).toBe("PAPER");
    expect(trophies[2]!.label).toBe(ui.pages.trophies.plaqueLabel);
    for (const i of [0, 3, 4, 5]) expect(trophies[i]!.label).toBeUndefined();
  });

  it("selects the first unlocked trophy (the cup) first", () => {
    const view = build();
    expect(view.defaultId).toBe(view.trophies[0]!.id);
  });

  it("takes its labels from the copy", () => {
    const view = build();
    expect(view.listLabel).toBe(ui.pages.trophies.listLabel);
    expect(view.plinthLabel).toBe("ON THE PLINTH");
  });

  it("the academy: school name, degree, one meta line and the extras", () => {
    const { academy } = build();
    expect(academy.id).toBe("academy");
    expect(academy.eyebrow).toBe("EDUCATION");
    expect(academy.aside).toBe("WHERE THE FUNDAMENTALS CAME FROM");
    expect(academy.title).toBe("TRAINING ACADEMY");
    expect(academy.monogram).toBe("PICT");
    expect(academy.name).toBe("Pune Institute of Computer Technology");
    expect(academy.degree).toBe("B.Tech, Information Technology");
    expect(academy.meta).toBe("Jul 2020 – Jun 2024 · CGPA 8.94 · Distinction, SPPU");
    expect(academy.extrasLabel).toBe("EXTRA DRILLS");
    expect(academy.extras).toBe(content.trainingAcademy.extras.join(" · "));
    expect(academy.extraItems).toEqual(content.trainingAcademy.extras);
  });

  it("has no default selection when nothing is unlocked", () => {
    const allLocked = {
      ...content,
      trophyRoom: [content.trophyRoom.at(-1)!],
    } as Content;
    const view = build(allLocked);
    expect(view.defaultId).toBe("");
    expect(view.trophies[0]!.detail).toBeNull();
  });
});
