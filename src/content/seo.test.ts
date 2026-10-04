import { describe, expect, it } from "vitest";
import { content } from "./index";
import { getPersonJsonLd } from "./seo";

describe("getPersonJsonLd", () => {
  const ld = getPersonJsonLd(content);
  const { contact } = content.player;

  it("describes a schema.org Person", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Person");
    expect(ld.name).toBe("Yash Sarda");
    expect(ld.jobTitle).toBe("Software Engineer");
  });

  it("includes employer, address and school", () => {
    expect(ld.worksFor).toEqual({ "@type": "Organization", name: "Deutsche Bank" });
    expect(ld.address).toMatchObject({ addressLocality: "Pune", addressCountry: "India" });
    expect(ld.alumniOf).toMatchObject({ name: content.trainingAcademy.school });
  });

  it("lists profiles in order and a mailto email", () => {
    expect(ld.sameAs).toEqual([
      contact.linkedin,
      contact.github,
      contact.leetcode,
      contact.codeforces,
      contact.codechef,
    ]);
    expect(ld.email).toBe("mailto:yashsarda2002@gmail.com");
  });

  it("is safe inside a <script> tag and leaks no phone number or private PDF", () => {
    const json = JSON.stringify(ld);
    expect(json).not.toContain("</");
    expect(json).not.toContain("telephone");
    expect(json).not.toContain(".pdf");
  });
});
