import { describe, expect, it } from "vitest";
import { reportVerdict } from "./verdict";

describe("reportVerdict", () => {
  it("bands the overall score", () => {
    expect(reportVerdict(95, {})).toMatch(/^Excellent\./);
    expect(reportVerdict(90, {})).toMatch(/^Excellent\./);
    expect(reportVerdict(89, {})).toMatch(/^In good shape\./);
    expect(reportVerdict(70, {})).toMatch(/^In good shape\./);
    expect(reportVerdict(69, {})).toMatch(/^Findable, with gaps\./);
    expect(reportVerdict(50, {})).toMatch(/^Findable, with gaps\./);
    expect(reportVerdict(49, {})).toMatch(/^Hard to find\./);
    expect(reportVerdict(0, {})).toMatch(/^Hard to find\./);
  });
  it("names the most severe issues first, with correct plurals", () => {
    expect(reportVerdict(62, { critical: 1, high: 4 })).toBe("Findable, with gaps. 1 critical issue holds it back.");
    expect(reportVerdict(62, { critical: 2 })).toBe("Findable, with gaps. 2 critical issues hold it back.");
    expect(reportVerdict(75, { high: 3, medium: 2 })).toBe("In good shape. 3 high-priority issues are the place to start.");
    expect(reportVerdict(92, { medium: 1, low: 2 })).toBe("Excellent. 3 smaller issues left to tidy.");
    expect(reportVerdict(98, {})).toBe("Excellent. No issues found on the pages we checked.");
  });
  it("never promises or alarms", () => {
    const lines = [0, 30, 55, 80, 99].flatMap((s) => [reportVerdict(s, { critical: 3 }), reportVerdict(s, {})]);
    for (const l of lines) expect(l).not.toMatch(/guarantee|will rank|#1|urgent|danger|!|failing/i);
  });
  it("handles a missing score", () => {
    expect(reportVerdict(null, { high: 1 })).toBe("Not enough data for an overall score.");
  });
});
