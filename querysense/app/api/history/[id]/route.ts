import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.queryAnalysis.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Query analysis record not found" },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      id: record.id,
      score: record.score,
      severity: record.severity,
      original_query: record.originalQuery,
      optimized_query: record.optimizedQuery,
      issues,
      metrics,
      explanation: record.explanation,
      analyzed_at: record.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Single history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve query analysis record" },
      { status: 500 }
    );
  }
}
