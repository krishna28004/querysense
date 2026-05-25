import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runRuleEngine } from "@/lib/analyzer/rules";
import { runAIAnalysis } from "@/lib/analyzer/ai";
import { mergeResults } from "@/lib/analyzer/merger";
import { prisma } from "@/lib/db/prisma";

const analyzeSchema = z.object({
  sql: z.string().min(1, "SQL query cannot be empty"),
  schema: z.string().optional(),
  dialect: z.enum(["postgresql"]).optional().default("postgresql"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = analyzeSchema.parse(body);

    const { sql, schema } = validated;

    // 1. Run deterministic rule-based checks
    const ruleIssues = runRuleEngine(sql);

    // 2. Call Google Gemini analyzer (with fallback to mock responses or dynamic heuristics if offline/error)
    const aiResult = await runAIAnalysis(sql, ruleIssues, schema);

    // 3. Merge, deduplicate, score, and format
    const analysisResponse = mergeResults(
      sql,
      ruleIssues,
      aiResult.issues,
      aiResult.optimized_query,
      aiResult.metrics,
      aiResult.explanation
    );

    // 4. Save to SQLite DB for history
    try {
      const dbRecord = await prisma.queryAnalysis.create({
        data: {
          originalQuery: analysisResponse.original_query,
          optimizedQuery: analysisResponse.optimized_query,
          score: analysisResponse.score,
          severity: analysisResponse.severity,
          issues: JSON.stringify(analysisResponse.issues),
          metrics: JSON.stringify(analysisResponse.metrics),
          explanation: analysisResponse.explanation,
        },
      });

      // Map DB record ID to final response ID so history can link correctly
      analysisResponse.id = dbRecord.id;
    } catch (dbError) {
      console.error("Database save failed:", dbError);
      // Graceful degradation: still return analysis even if database fails
    }

    return NextResponse.json(analysisResponse);
  } catch (error) {
    console.error("Analysis API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error during query analysis" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
