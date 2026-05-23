import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const records = await prisma.queryAnalysis.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const parsedRecords = records.map((record) => {
      let issues = [];
      let metrics = {};

      try {
        issues = JSON.parse(record.issues);
      } catch (e) {
        console.error("Failed to parse issues JSON for record:", record.id);
      }

      try {
        metrics = JSON.parse(record.metrics);
      } catch (e) {
        console.error("Failed to parse metrics JSON for record:", record.id);
      }

      const typedIssues = issues as Array<{ source?: string; confidence?: number }>;
      const hasRule = typedIssues.some((issue) => issue.source === "rule");
      const hasAI = typedIssues.some((issue) => issue.source === "ai");
      const avgConfidence = typedIssues.length
        ? typedIssues.reduce((sum, issue) => sum + (issue.confidence ?? 0.8), 0) / typedIssues.length
        : 0.85;

      return {
        id: record.id,
        score: record.score,
        severity: record.severity,
        original_query: record.originalQuery,
        optimized_query: record.optimizedQuery,
        issues,
        metrics,
        explanation: record.explanation,
        metadata: {
          confidence: Number(avgConfidence.toFixed(2)),
          reasoning_source: "Historical playback from stored analysis",
          execution_timestamp: record.createdAt.toISOString(),
          detected_by: hasRule && hasAI ? "Hybrid" : hasAI ? "AI" : "Rule Engine",
          why_this_suggestion:
            "Stored suggestions are ranked by performance impact and safety at the time of analysis.",
        },
        ai_disclaimer:
          "Estimated performance only. Validate with EXPLAIN ANALYZE on production-like data.",
        analyzed_at: record.createdAt.toISOString(),
      };
    });

    return NextResponse.json(parsedRecords);
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve query history" },
      { status: 500 }
    );
  }
}
