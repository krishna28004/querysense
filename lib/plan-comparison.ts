import type { PlanReport } from "./plan-analysis";

export type PlanComparison = {
  metric: "execution time" | "planner cost" | "unavailable";
  before?: number;
  after?: number;
  changePercent?: number;
  unit: "ms" | "cost units" | "";
  interpretation: string;
};

export function comparePlans(before: PlanReport, after: PlanReport): PlanComparison {
  if (before.kind === "measured" && after.kind === "measured" && before.executionTimeMs !== undefined && after.executionTimeMs !== undefined) {
    return {
      metric: "execution time", before: before.executionTimeMs, after: after.executionTimeMs,
      changePercent: before.executionTimeMs > 0 ? ((after.executionTimeMs - before.executionTimeMs) / before.executionTimeMs) * 100 : undefined,
      unit: "ms",
      interpretation: "These are two pasted measurements, not a benchmark. Repeat warm and cold runs under comparable load and confirm result equivalence before drawing a conclusion.",
    };
  }
  if (before.totalCost !== undefined && after.totalCost !== undefined) {
    return {
      metric: "planner cost", before: before.totalCost, after: after.totalCost,
      changePercent: before.totalCost > 0 ? ((after.totalCost - before.totalCost) / before.totalCost) * 100 : undefined,
      unit: "cost units",
      interpretation: "Planner cost is an estimate in arbitrary units. It is not elapsed time and cannot establish a speedup. Collect comparable EXPLAIN ANALYZE plans to measure the change.",
    };
  }
  return { metric: "unavailable", unit: "", interpretation: "The supplied plans do not contain comparable execution times or total costs." };
}
