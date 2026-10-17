export type WorkloadMetric = "total_exec_time" | "mean_exec_time" | "calls" | "shared_blks_read";

export type WorkloadRow = {
  queryId: string;
  query: string;
  calls: number;
  totalExecTimeMs: number;
  meanExecTimeMs: number;
  sharedBlocksRead: number;
};

export type WorkloadReport = {
  rows: WorkloadRow[];
  totalCalls: number;
  totalExecTimeMs: number;
  totalSharedBlocksRead: number;
  warnings: string[];
};

const MAX_ROWS = 25_000;
const MAX_CSV_LENGTH = 10_000_000;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"' && field.length === 0) quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      if (row.some(value => value.trim() !== "")) rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS + 1) throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} row limit.`);
    } else field += char;
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  row.push(field);
  if (row.some(value => value.trim() !== "")) rows.push(row);
  if (rows.length > MAX_ROWS + 1) throw new Error(`CSV exceeds the ${MAX_ROWS.toLocaleString()} row limit.`);
  return rows;
}

function numeric(value: string | undefined, fallback?: number): number | undefined {
  if (value === undefined || value.trim() === "") return fallback;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : undefined;
}

export function parseWorkloadCsv(input: string): WorkloadReport {
  if (input.length > MAX_CSV_LENGTH) throw new Error("CSV exceeds the 10 MB import limit.");
  const records = parseCsv(input.replace(/^\uFEFF/, ""));
  if (records.length < 2) throw new Error("CSV needs a header row and at least one query row.");
  const headers = records[0].map(header => header.trim().toLowerCase());
  const column = (...names: string[]) => headers.findIndex(header => names.includes(header));
  const queryIndex = column("query", "query_text");
  const callsIndex = column("calls");
  const totalIndex = column("total_exec_time", "total_time");
  const meanIndex = column("mean_exec_time", "mean_time");
  const blocksIndex = column("shared_blks_read");
  const idIndex = column("queryid", "query_id");
  if (queryIndex < 0 || callsIndex < 0 || (totalIndex < 0 && meanIndex < 0)) {
    throw new Error("Expected pg_stat_statements columns: query, calls, and total_exec_time (or mean_exec_time). See the import guide.");
  }

  const warnings: string[] = [];
  const parsed: WorkloadRow[] = [];
  for (let i = 1; i < records.length; i += 1) {
    const values = records[i];
    const query = values[queryIndex]?.trim() ?? "";
    const calls = numeric(values[callsIndex]);
    const total = totalIndex >= 0 ? numeric(values[totalIndex]) : undefined;
    const mean = meanIndex >= 0 ? numeric(values[meanIndex]) : undefined;
    if (!query || calls === undefined || (total === undefined && mean === undefined)) {
      warnings.push(`Skipped row ${i + 1}: missing query text or invalid calls/time value.`);
      continue;
    }
    const totalExecTimeMs = total ?? (mean ?? 0) * calls;
    const meanExecTimeMs = mean ?? (calls > 0 ? totalExecTimeMs / calls : 0);
    parsed.push({
      queryId: idIndex >= 0 ? values[idIndex]?.trim() || `row-${i + 1}` : `row-${i + 1}`,
      query,
      calls,
      totalExecTimeMs,
      meanExecTimeMs,
      sharedBlocksRead: blocksIndex >= 0 ? numeric(values[blocksIndex], 0) ?? 0 : 0,
    });
  }
  if (parsed.length === 0) throw new Error("No valid query rows were found in this CSV.");
  if (blocksIndex < 0) warnings.push("This export has no shared_blks_read column; read-based ranking is unavailable.");
  if (totalIndex < 0) warnings.push("Total execution time was derived from mean_exec_time × calls.");
  if (warnings.length > 50) warnings.splice(50, warnings.length - 50, "Additional invalid rows were skipped.");
  return {
    rows: parsed,
    totalCalls: parsed.reduce((sum, row) => sum + row.calls, 0),
    totalExecTimeMs: parsed.reduce((sum, row) => sum + row.totalExecTimeMs, 0),
    totalSharedBlocksRead: parsed.reduce((sum, row) => sum + row.sharedBlocksRead, 0),
    warnings,
  };
}

export function rankWorkload(rows: WorkloadRow[], metric: WorkloadMetric): WorkloadRow[] {
  const value = (row: WorkloadRow) => {
    switch (metric) {
      case "mean_exec_time": return row.meanExecTimeMs;
      case "calls": return row.calls;
      case "shared_blks_read": return row.sharedBlocksRead;
      default: return row.totalExecTimeMs;
    }
  };
  return [...rows].sort((a, b) => value(b) - value(a));
}
