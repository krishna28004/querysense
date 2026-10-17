import { Parser } from "node-sql-parser";

export type Finding = {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  source: "sql" | "plan";
  evidence: string;
  explanation: string;
  action: string;
  verify: string;
};

export type SqlReport = {
  statement: string;
  tables: string[];
  findings: Finding[];
  limitations: string[];
};

type ObjectNode = Record<string, unknown>;
const isObject = (value: unknown): value is ObjectNode =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function nodes(value: unknown, max = 8000): ObjectNode[] {
  const queue: unknown[] = [value];
  const result: ObjectNode[] = [];
  while (queue.length) {
    const item = queue.shift();
    if (!isObject(item)) {
      if (Array.isArray(item)) queue.push(...item);
      continue;
    }
    result.push(item);
    if (result.length > max) throw new Error("SQL structure is too complex to inspect safely.");
    for (const child of Object.values(item)) if (typeof child === "object" && child !== null) queue.push(child);
  }
  return result;
}

function columnName(node: unknown): string | null {
  if (!isObject(node) || node.type !== "column_ref") return null;
  const raw = node.column;
  const value = typeof raw === "string" ? raw : isObject(raw) && isObject(raw.expr) ? raw.expr.value : null;
  if (typeof value !== "string") return null;
  return `${typeof node.table === "string" ? `${node.table}.` : ""}${value}`;
}

function textValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (isObject(value) && typeof value.value === "string") return value.value;
  return null;
}

export function inspectSql(sql: string): SqlReport {
  const parser = new Parser();
  let ast: unknown;
  try {
    ast = parser.astify(sql, { database: "Postgresql" });
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : "Invalid SQL";
    throw new Error(`PostgreSQL parser could not read this query: ${message.slice(0, 220)}`);
  }
  if (Array.isArray(ast)) {
    if (ast.length !== 1) throw new Error("Analyze one SQL statement at a time.");
    ast = ast[0];
  }
  if (!isObject(ast) || ast.type !== "select") throw new Error("This workspace analyzes read-only SELECT queries, including CTEs. DML and DDL are not supported.");
  const all = nodes(ast);
  if (all.some(node => ["insert", "update", "delete", "create", "drop", "alter", "truncate"].includes(String(node.type)))) {
    throw new Error("This workspace does not analyze data-modifying CTEs or other mutating statements.");
  }
  if (all.some(node => node.type === "select" && isObject(node.into) && node.into.expr !== undefined)) {
    throw new Error("This workspace does not analyze SELECT INTO because it creates a table.");
  }
  const selects = all.filter(node => node.type === "select");
  const tables = [...new Set(all.filter(node => typeof node.table === "string" && ("db" in node || "as" in node)).map(node => String(node.table)))];
  const findings: Finding[] = [];
  const add = (finding: Finding) => { if (!findings.some(other => other.id === finding.id && other.evidence === finding.evidence)) findings.push(finding); };

  for (const select of selects) {
    const columns = Array.isArray(select.columns) ? select.columns : [];
    if (columns.some(item => isObject(item) && columnName(item.expr)?.endsWith("*") === true)) {
      add({ id: "select-star", title: "Projection includes every column", severity: "medium", source: "sql", evidence: "SELECT *", explanation: "Wide rows can increase transfer and memory use. The effect depends on selected columns and result size.", action: "List only the columns the caller needs. Keep * when the full row is intentional.", verify: "Compare result shape and EXPLAIN (ANALYZE, BUFFERS) on representative data." });
    }
    const from = Array.isArray(select.from) ? select.from : [];
    for (const item of from) {
      if (!isObject(item)) continue;
      const join = String(item.join ?? "").toUpperCase();
      if (join.includes("JOIN") && !join.includes("NATURAL") && !item.on && !item.using) add({ id: "cross-join", title: "Join without a predicate", severity: "medium", source: "sql", evidence: `Joined table ${String(item.table ?? "unknown")} has no ON/USING condition`, explanation: "This can produce a Cartesian product. It may also be intentional, so inspect the result size.", action: "Confirm the row combination is intended; otherwise add a relationship predicate.", verify: "Inspect actual join row counts in the PostgreSQL plan." });
    }
    if (isObject(select.limit) && Array.isArray(select.limit.value)) {
      const offset = select.limit.value[1];
      const number = isObject(offset) ? Number(offset.value) : NaN;
      if (Number.isFinite(number) && number >= 1000) add({ id: "large-offset", title: "Deep offset pagination", severity: "medium", source: "sql", evidence: `OFFSET ${number}`, explanation: "The database may still process skipped rows before returning the requested page.", action: "Consider keyset pagination using a stable, indexed ordering key.", verify: "Compare plans and results at shallow and deep pages, including tie handling." });
    }
  }

  const filterNodes = selects.flatMap(select => select.where ? nodes(select.where) : []);
  for (const node of filterNodes) {
    if (node.type !== "binary_expr") continue;
    const operator = String(node.operator ?? "").toUpperCase();
    const left = columnName(node.left);
    if ((operator === "LIKE" || operator === "ILIKE") && left && isObject(node.right)) {
      const literal = textValue(node.right.value);
      if (literal?.startsWith("%")) add({ id: "leading-wildcard", title: "Substring search needs a different access path", severity: "medium", source: "sql", evidence: `${left} ${operator} '${literal.slice(0, 36)}'`, explanation: "A leading wildcard generally prevents a normal B-tree prefix lookup.", action: "If this is frequent and selective, consider pg_trgm with a GIN index; assess write and storage cost.", verify: "Check the existing indexes, cardinality, and the scan node before creating one." });
    }
    if (["=", ">", "<", ">=", "<="].includes(operator)) {
      const expression = isObject(node.left) && node.left.type === "function" ? node.left : isObject(node.right) && node.right.type === "function" ? node.right : null;
      const col = expression ? nodes(expression, 100).map(columnName).find(Boolean) : null;
      if (col) add({ id: "function-filter", title: "Function in a filter predicate", severity: "low", source: "sql", evidence: `Function applied to ${col}`, explanation: "A function around an indexed column can require an expression index or a different predicate.", action: "Review the exact expression and existing indexes before changing SQL.", verify: "Compare the plan with an expression index or a semantics-preserving predicate." });
    }
  }

  return {
    statement: "PostgreSQL SELECT",
    tables,
    findings,
    limitations: [
      "Static inspection does not know table size, row distribution, existing indexes, or runtime.",
      "Findings are hypotheses until checked against a PostgreSQL plan and representative data.",
    ],
  };
}
