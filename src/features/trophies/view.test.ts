import { describe, expect, it } from "vitest";
import { content, ui, type Content } from "@/content";
import { buildTrophiesView } from "./view";

const build = (c: Content = content) => buildTrophiesView(c, ui);

describe("buildTrophiesView", () => {
  it("lists Yash's five trophies in content order", () => {
    const { trophies } = build();
    expect(trophies.map((t) => t.kind)).toEqual(["cup", "medal", "plaque", "pennant", "round"]);
    expect(trophies.map((t) => t.title)).toEqual(content.trophyRoom.map((t) => t.title));
    expect(trophies.map((t) => t.id)).toEqual([
      "trophy-1",
      "trophy-2",
      "trophy-3",
      "trophy-4",
      "trophy-5",
    ]);
  });

  it("every trophy has a detail, numbered n / 5", () => {
    const { trophies } = build();
    for (const t of trophies) expect(t.detail).not.toBeNull();
    expect(trophies.map((t) => t.detail.index)).toEqual([
      "1 / 5",
      "2 / 5",
      "3 / 5",
      "4 / 5",
      "5 / 5",
    ]);
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
    for (const i of [0, 3, 4]) expect(trophies[i]!.label).toBeUndefined();
  });

  it("selects the cup first", () => {
    expect(build().defaultId).toBe("trophy-1");
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
    expect(academy.meta).toBe("Jul 2020 – Jun 2024 · CGPA 8.94 · Distinction");
    expect(academy.extrasLabel).toBe("EXTRA DRILLS");
    expect(academy.extras).toBe(content.trainingAcademy.extras.join(" · "));
    expect(academy.extraItems).toEqual(content.trainingAcademy.extras);
  });
});
