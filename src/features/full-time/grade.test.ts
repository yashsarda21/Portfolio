import { describe, expect, it } from "vitest";
import { FULL_TIME_GRADES, gradeFor } from "./grade";

describe("gradeFor (F4)", () => {
  it("averages the three venues' best forms; a missing venue counts 0", () => {
    expect(gradeFor({})).toBe("goodTry");
    expect(gradeFor({ cricket: 1, tennis: 1 })).toBe("soClose"); // 2/3 ≥ 0.6
    expect(gradeFor({ cricket: 1 / 3, tennis: 1 / 3 })).toBe("niceEffort"); // 0.222
    expect(gradeFor({ cricket: 0.25, tennis: 0.25 })).toBe("goodTry"); // 0.1667 < 0.2
  });
  it("meets each threshold inclusively", () => {
    const at = (avg: number) => gradeFor({ cricket: avg, tennis: avg, badminton: avg });
    expect(at(FULL_TIME_GRADES.soClose)).toBe("soClose");
    expect(at(FULL_TIME_GRADES.niceEffort)).toBe("niceEffort");
  });
});
