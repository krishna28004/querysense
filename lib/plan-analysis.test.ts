import { describe, expect, it } from "vitest";
import { inspectPlan } from "./plan-analysis";

describe("PostgreSQL plan evidence", () => {
  it("keeps estimated plans separate from measured plans", () => {
    const estimated = inspectPlan(JSON.stringify([{ Plan: { "Node Type": "Seq Scan", "Plan Rows": 200, "Total Cost": 15 } }]));
    expect(estimated.kind).toBe("estimated");
    expect(estimated.executionTimeMs).toBeUndefined();
    const measured = inspectPlan(JSON.stringify([{ Plan: { "Node Type": "Seq Scan", "Plan Rows": 200, "Actual Rows": 20, "Actual Loops": 1, "Actual Total Time": 5 }, "Execution Time": 5.2 }]));
    expect(measured.kind).toBe("measured");
    expect(measured.executionTimeMs).toBe(5.2);
  });
  it("grounds findings in actual plan fields", () => {
    const result = inspectPlan(JSON.stringify([{ Plan: { "Node Type": "Seq Scan", "Relation Name": "orders", "Plan Rows": 1000, "Actual Rows": 10, "Actual Loops": 1, "Rows Removed by Filter": 20000 } }]));
    expect(result.findings.map(item => item.id)).toEqual(expect.arrayContaining(["estimate-1", "scan-1"]));
  });
  it("preserves detailed node evidence for the plan inspector", () => {
    const result = inspectPlan(JSON.stringify([{ Plan: { "Node Type": "Sort", "Plan Rows": 20, "Actual Rows": 18, "Actual Loops": 2, "Actual Total Time": 4.5, "Total Cost": 18, "Sort Method": "external merge", "Sort Space Used": 512, "Temp Read Blocks": 6, "Temp Written Blocks": 8, Plans: [{ "Node Type": "Index Scan", "Index Cond": "(id > 10)", "Rows Removed by Filter": 12, "Shared Hit Blocks": 32, "Shared Read Blocks": 3 }] } }]));
    expect(result.root).toMatchObject({ loops: 2, totalCost: 18, sortMethod: "external merge", sortSpaceUsedKb: 512, tempReadBlocks: 6, tempWrittenBlocks: 8 });
    expect(result.root.children[0]).toMatchObject({ indexCondition: "(id > 10)", rowsRemovedByFilter: 12, sharedHitBlocks: 32, sharedReadBlocks: 3 });
  });
  it("does not call a top-N sort an estimate failure", () => {
    const result = inspectPlan(JSON.stringify([{ Plan: { "Node Type": "Limit", "Plan Rows": 50, "Actual Rows": 50, Plans: [{ "Node Type": "Sort", "Plan Rows": 1200, "Actual Rows": 50 }] } }]));
    expect(result.findings).toHaveLength(0);
  });
  it("rejects unrelated JSON", () => {
    expect(() => inspectPlan("{}")) .toThrow(/Expected PostgreSQL/);
    expect(() => inspectPlan("not json")).toThrow(/valid PostgreSQL/);
    expect(() => inspectPlan(JSON.stringify([{ Plan: { "Node Type": "Result" } }, { Plan: { "Node Type": "Result" } }]))).toThrow(/exactly one/);
  });
});
