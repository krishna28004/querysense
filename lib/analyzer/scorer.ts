import { Issue, Severity } from "./types";

const CATEGORY_WEIGHTS: Record<string, number> = {
  missing_where: 25,
  bad_join: 20,
  n_plus_one: 20,
  full_table_scan: 15,
  nested_subquery: 15,
  select_star: 10,
  expensive_aggregation: 10,
  missing_limit: 5,
  redundant_distinct: 5,
  redundant_order_by: 5,
};

const SEVERITY_MULTIPLIERS = {
  critical: 1.0,
  warning: 0.7,
  info: 0.3,
};

export function calculateScore(issues: Issue[]): { score: number; severity: Severity } {
  if (issues.length === 0) {
    return { score: 100, severity: "good" };
  }

  let totalDeduction = 0;

  for (const issue of issues) {
    const weight = CATEGORY_WEIGHTS[issue.category] ?? 10;
    const multiplier = SEVERITY_MULTIPLIERS[issue.severity] ?? 0.5;
    totalDeduction += weight * multiplier;
  }

  const rawScore = 100 - totalDeduction;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let severity: Severity = "good";
  if (score < 40) {
    severity = "critical";
  } else if (score < 75) {
    severity = "warning";
  } else if (score < 95) {
    severity = "info";
  }

  return { score, severity };
}
