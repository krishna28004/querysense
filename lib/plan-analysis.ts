import type { Finding } from "./diagnostics";

export type PlanNode = {
  label: string;
  relation?: string;
  actualRows?: number;
  estimatedRows?: number;
  actualTimeMs?: number;
  loops?: number;
  rowsRemovedByFilter?: number;
  totalCost?: number;
  sharedHitBlocks?: number;
  sharedReadBlocks?: number;
  tempReadBlocks?: number;
  tempWrittenBlocks?: number;
  filter?: string;
  indexCondition?: string;
  sortMethod?: string;
  sortSpaceUsedKb?: number;
  hashBatches?: number;
  children: PlanNode[];
};

export type PlanReport = {
  kind: "estimated" | "measured";
  executionTimeMs?: number;
  planningTimeMs?: number;
  totalCost?: number;
  nodeCount: number;
  root: PlanNode;
  findings: Finding[];
};

type JsonObject = Record<string, unknown>;
const object = (value: unknown): value is JsonObject => value !== null && typeof value === "object" && !Array.isArray(value);
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;

export function inspectPlan(input: string): PlanReport {
  let parsed: unknown;
  try { parsed = JSON.parse(input); } catch { throw new Error("Plan must be valid PostgreSQL EXPLAIN JSON."); }
  if (Array.isArray(parsed) && parsed.length !== 1) throw new Error("Plan must contain exactly one PostgreSQL statement.");
  const wrapper = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!object(wrapper) || !object(wrapper.Plan) || typeof wrapper.Plan["Node Type"] !== "string") throw new Error("Expected PostgreSQL EXPLAIN (FORMAT JSON) output with a Plan object.");
  const findings: Finding[] = [];
  let nodeCount = 0;
  let measured = false;

  function visit(raw: JsonObject, depth: number): PlanNode {
    if (++nodeCount > 500 || depth > 40) throw new Error("Plan exceeds the supported node or depth limit.");
    if (typeof raw["Node Type"] !== "string") throw new Error("Malformed plan child node.");
    const label = raw["Node Type"] as string;
    const relation = typeof raw["Relation Name"] === "string" ? raw["Relation Name"] as string : undefined;
    const estimatedRows = number(raw["Plan Rows"]);
    const actualRows = number(raw["Actual Rows"]);
    const loops = number(raw["Actual Loops"]);
    const actualTimeMs = number(raw["Actual Total Time"]);
    const rowsRemovedByFilter = number(raw["Rows Removed by Filter"]);
    const totalCost = number(raw["Total Cost"]);
    const sharedHitBlocks = number(raw["Shared Hit Blocks"]);
    const sharedReadBlocks = number(raw["Shared Read Blocks"]);
    const tempReadBlocks = number(raw["Temp Read Blocks"]);
    const tempWrittenBlocks = number(raw["Temp Written Blocks"]);
    const filter = typeof raw.Filter === "string" ? raw.Filter : undefined;
    const indexCondition = typeof raw["Index Cond"] === "string" ? raw["Index Cond"] : undefined;
    const sortMethod = typeof raw["Sort Method"] === "string" ? raw["Sort Method"] : undefined;
    const sortSpaceUsedKb = number(raw["Sort Space Used"]);
    const hashBatches = number(raw["Hash Batches"]);
    if (actualRows !== undefined) measured = true;
    const ref = relation ? `${label} on ${relation}` : label;

    if (/(Scan|Join)$/.test(label) && estimatedRows !== undefined && actualRows !== undefined && estimatedRows > 0 && (loops ?? 1) > 0) {
      const ratio = Math.max(actualRows / estimatedRows, estimatedRows / Math.max(actualRows, 1));
      if (ratio >= 10 && Math.max(actualRows, estimatedRows) >= 100) findings.push({ id: `estimate-${nodeCount}`, title: "Large row estimate mismatch", severity: "high", source: "plan", evidence: `${ref}: estimated ${estimatedRows.toLocaleString()}, actual ${actualRows.toLocaleString()} rows per loop`, explanation: "The planner expected a substantially different row count. A LIMIT or early stop can also explain a difference.", action: "Rule out early stopping, then inspect filter selectivity and table statistics.", verify: "Compare the full plan after refreshing statistics in a safe environment." });
    }
    if (label === "Seq Scan" && relation && number(raw["Rows Removed by Filter"]) !== undefined && (number(raw["Rows Removed by Filter"]) ?? 0) >= 1000) {
      findings.push({ id: `scan-${nodeCount}`, title: "Filtered sequential scan", severity: "medium", source: "plan", evidence: `${ref}: ${Number(raw["Rows Removed by Filter"]).toLocaleString()} rows removed per loop`, explanation: "The scan discards many rows. Sequential scans can still be optimal for small tables or unselective filters.", action: "Check existing indexes and predicate selectivity before proposing a new index.", verify: "Compare total time and buffers with a representative workload after testing an index." });
    }
    if (label === "Sort" && typeof raw["Sort Method"] === "string" && String(raw["Sort Method"]).toLowerCase().includes("external")) {
      findings.push({ id: `sort-${nodeCount}`, title: "Sort spilled to disk", severity: "medium", source: "plan", evidence: `${raw["Sort Method"]}${raw["Sort Space Used"] ? ` · ${raw["Sort Space Used"]} kB` : ""}`, explanation: "This sort used disk rather than staying in memory.", action: "Review sort input size, useful indexes, and per-query work_mem tradeoffs.", verify: "Compare sort method, disk usage, time, and memory under realistic concurrency." });
    }
    const children = Array.isArray(raw.Plans) ? raw.Plans.map(child => {
      if (!object(child)) throw new Error("Malformed plan child node.");
      return visit(child, depth + 1);
    }) : [];
    return { label, relation, actualRows, estimatedRows, actualTimeMs, loops, rowsRemovedByFilter, totalCost, sharedHitBlocks, sharedReadBlocks, tempReadBlocks, tempWrittenBlocks, filter, indexCondition, sortMethod, sortSpaceUsedKb, hashBatches, children };
  }

  const root = visit(wrapper.Plan, 0);
  return { kind: measured ? "measured" : "estimated", executionTimeMs: number(wrapper["Execution Time"]), planningTimeMs: number(wrapper["Planning Time"]), totalCost: number(wrapper.Plan["Total Cost"]), nodeCount, root, findings };
}
