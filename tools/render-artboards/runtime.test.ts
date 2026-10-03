import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

interface DcTemplate {
  resolvePath(path: string, scope: Record<string, unknown>): unknown;
  interpolate(text: string, scope: Record<string, unknown>): string;
  renderTemplate(root: Element, scope: Record<string, unknown>): void;
  boot(): void;
}
declare global {
  interface Window {
    __dcTemplate: DcTemplate;
  }
}

beforeAll(() => {
  const src = readFileSync(join(process.cwd(), "tools/render-artboards/runtime.js"), "utf8");
  new Function(src)();
});

function host(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el;
}

describe("artboard runtime", () => {
  it("resolves dotted paths", () => {
    expect(window.__dcTemplate.resolvePath("b.bg", { b: { bg: "#000" } })).toBe("#000");
    expect(window.__dcTemplate.resolvePath("missing.x", {})).toBeUndefined();
  });

  it("interpolates text and attributes, dropping event handlers", () => {
    const el = host('<span style="color:{{c}}" onclick="{{go}}">{{label}}</span>');
    window.__dcTemplate.renderTemplate(el, { c: "red", label: "FOUR.", go: () => {} });
    const span = el.querySelector("span")!;
    expect(span.textContent).toBe("FOUR.");
    expect(span.getAttribute("style")).toBe("color:red");
    expect(span.hasAttribute("onclick")).toBe(false);
  });

  it("repeats sc-for children with the alias in scope", () => {
    const el = host('<sc-for list="{{balls}}" as="b"><i>{{b.label}}</i></sc-for>');
    window.__dcTemplate.renderTemplate(el, {
      balls: [{ label: "1" }, { label: "2" }, { label: "3" }],
    });
    expect(Array.from(el.querySelectorAll("i")).map((i) => i.textContent)).toEqual(["1", "2", "3"]);
    expect(el.querySelector("sc-for")).toBeNull();
  });

  it("renders nested sc-for loops (groups of skills)", () => {
    const el = host(
      '<sc-for list="{{groups}}" as="g"><section><h2>{{g.name}}</h2>' +
        '<sc-for list="{{g.skills}}" as="s"><i>{{g.name}}:{{s}}</i></sc-for></section></sc-for>',
    );
    window.__dcTemplate.renderTemplate(el, {
      groups: [
        { name: "Backend", skills: ["Java", "Kafka"] },
        { name: "Data", skills: ["SQL"] },
      ],
    });
    expect(Array.from(el.querySelectorAll("h2")).map((h) => h.textContent)).toEqual([
      "Backend",
      "Data",
    ]);
    expect(Array.from(el.querySelectorAll("i")).map((i) => i.textContent)).toEqual([
      "Backend:Java",
      "Backend:Kafka",
      "Data:SQL",
    ]);
    expect(el.querySelectorAll("section")[1]!.querySelectorAll("i")).toHaveLength(1);
  });

  it("interpolates attributes inside a loop", () => {
    const el = host(
      '<sc-for list="{{skills}}" as="s"><b style="background:{{s.bg}}">{{s.label}}</b></sc-for>',
    );
    window.__dcTemplate.renderTemplate(el, {
      skills: [
        { label: "A", bg: "red" },
        { label: "B", bg: "blue" },
      ],
    });
    expect(Array.from(el.querySelectorAll("b")).map((b) => b.getAttribute("style"))).toEqual([
      "background:red",
      "background:blue",
    ]);
  });

  it("uses hint-placeholder-count when the list is undefined", () => {
    const el = host(
      '<sc-for list="{{nothing}}" as="x" hint-placeholder-count="2"><b>slot</b></sc-for>',
    );
    window.__dcTemplate.renderTemplate(el, {});
    expect(el.querySelectorAll("b")).toHaveLength(2);
  });

  it("keeps or removes sc-if, falling back to the placeholder value", () => {
    const el = host(
      '<sc-if value="{{yes}}"><p>a</p></sc-if><sc-if value="{{no}}"><p>b</p></sc-if>' +
        '<sc-if value="{{unknown}}" hint-placeholder-val="{{true}}"><p>c</p></sc-if>',
    );
    window.__dcTemplate.renderTemplate(el, { yes: true, no: false });
    expect(Array.from(el.querySelectorAll("p")).map((p) => p.textContent)).toEqual(["a", "c"]);
  });

  it("boots a full artboard: runs DCLogic, hoists helmet, marks ready", () => {
    document.head.innerHTML = "";
    document.body.innerHTML =
      '<x-dc><helmet><style id="s">.d{}</style></helmet><div id="out">{{score}}</div></x-dc>' +
      '<script type="text/x-dc" data-props="{}">class Component extends DCLogic { renderVals() { return { score: "14*" }; } }</script>';
    window.__dcTemplate.boot();
    expect(document.getElementById("out")!.textContent).toBe("14*");
    expect(document.head.querySelector("#s")).not.toBeNull();
    expect(document.querySelector("x-dc")).toBeNull();
    expect(document.documentElement.getAttribute("data-dc-ready")).toBe("true");
  });
});
