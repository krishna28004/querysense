import { describe, expect, it } from "vitest";
import { comparePlans } from "./plan-comparison";
import { inspectPlan } from "./plan-analysis";

const plan = (cost: number, time?: number) => inspectPlan(JSON.stringify([{ Plan: { "Node Type": "Result", "Total Cost": cost, ...(time !== undefined ? { "Actual Rows": 1 } : {}) }, ...(time !== undefined ? { "Execution Time": time } : {}) }]));

describe("experiment replay", () => {
  it("compares measured times only when both plans have them", () => {
    const report = comparePlans(plan(30, 40), plan(25, 20));
    expect(report.metric).toBe("execution time");
    expect(report.changePercent).toBe(-50);
  });
  it("does not call cost change an elapsed-time improvement", () => {
    const report = comparePlans(plan(30), plan(25));
    expect(report.metric).toBe("planner cost");
    expect(report.unit).toBe("cost units");
    expect(report.interpretation).toMatch(/not elapsed time/);
  });
});
