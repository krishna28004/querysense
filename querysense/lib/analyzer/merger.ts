import { Issue, PerformanceMetrics, AnalysisResponse } from "./types";
import { calculateScore } from "./scorer";

export function mergeResults(
  sql: string,
  ruleIssues: Issue[],
  aiIssues: Omit<Issue, "id" | "source">[],
  optimizedQuery: string,
  metrics: PerformanceMetrics,
  explanation: string
): AnalysisResponse {
  const mergedIssues: Issue[] = [...ruleIssues];

  // Merge AI-detected issues while avoiding duplicates
  for (const aiIssue of aiIssues) {
    const isDuplicate = ruleIssues.some(
      (rule) =>
        rule.category === aiIssue.category &&
        (rule.line === aiIssue.line || (!rule.line && !aiIssue.line))
    );

    if (!isDuplicate) {
      mergedIssues.push({
        ...aiIssue,
        id: `ai-${aiIssue.category}-${Math.random().toString(36).substr(2, 5)}`,
        source: "ai",
      });
    }
  }

  // Sort issues: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  mergedIssues.sort((a, b) => {
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
  });

  const { score, severity } = calculateScore(mergedIssues);
  const avgConfidence = mergedIssues.length
    ? mergedIssues.reduce((sum, issue) => sum + issue.confidence, 0) / mergedIssues.length
    : 1;
  const hasRule = mergedIssues.some((issue) => issue.source === "rule");
  const hasAI = mergedIssues.some((issue) => issue.source === "ai");
  const detectedBy = hasRule && hasAI ? "Hybrid" : hasAI ? "AI" : "Rule Engine";

  const ruleWeight = hasRule ? 0.3 : 0.1;
  const aiConfidence = avgConfidence * 0.5;
  const complexityFactor = metrics.complexity_score.before > 5 ? 0.15 : 0.05;
  const optimizationConfidence = Math.min(1.0, ruleWeight + aiConfidence + complexityFactor);

  let recommendationBadge: "SAFE TO APPLY" | "REVIEW" | "HIGH RISK" = "REVIEW";
  if (optimizationConfidence >= 0.85) {
    recommendationBadge = "SAFE TO APPLY";
  } else if (optimizationConfidence <= 0.60) {
    recommendationBadge = "HIGH RISK";
  }

  return {
    id: `analysis-${Math.random().toString(36).substr(2, 9)}`,
    score,
    severity,
    original_query: sql,
    optimized_query: optimizedQuery || sql,
    issues: mergedIssues,
    metrics,
    explanation,
    metadata: {
      confidence: Number(avgConfidence.toFixed(2)),
      reasoning_source: "Rule engine + AI semantic analysis",
      execution_timestamp: new Date().toISOString(),
      detected_by: detectedBy,
      why_this_suggestion:
        "Suggestions prioritize high-cost scan reductions, join simplification, and safer query limits to improve throughput under scale.",
      optimization_confidence: Number((optimizationConfidence * 100).toFixed(0)),
      recommendation_badge: recommendationBadge,
    },
    ai_disclaimer:
      "Estimated values — actual execution may vary. Validate with EXPLAIN ANALYZE on production-like data.",
    analyzed_at: new Date().toISOString(),
  };
}
