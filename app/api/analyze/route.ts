import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { inspectSql } from "@/lib/diagnostics";
import { inspectPlan } from "@/lib/plan-analysis";
import { comparePlans } from "@/lib/plan-comparison";
import { reviewWithAI } from "@/lib/ai-review";

export const runtime = "nodejs";
const inputSchema = z.object({
  sql: z.string().trim().min(1).max(20000),
  candidateSql: z.string().max(20000).optional(),
  plan: z.string().max(180000).optional(),
  candidatePlan: z.string().max(180000).optional(),
  schema: z.string().max(10000).optional(),
  includeAI: z.boolean().default(false),
  accessCode: z.string().max(120).optional(),
});

const visits = new Map<string, { windowStart: number; count: number }>();
const loopbackHosts = new Set(["localhost", "127.0.0.1"]);

function isAllowedOrigin(origin: string, expected: string): boolean {
  try {
    const supplied = new URL(origin);
    const server = new URL(expected);
    return supplied.origin === server.origin || (
      supplied.protocol === server.protocol &&
      supplied.port === server.port &&
      loopbackHosts.has(supplied.hostname) &&
      loopbackHosts.has(server.hostname)
    );
  } catch { return false; }
}

function limited(key: string, limit: number): boolean {
  const now = Date.now();
  if (visits.size > 5000) for (const [address, value] of visits) if (now - value.windowStart > 60_000) visits.delete(address);
  if (!visits.has(key) && visits.size >= 5000) return true;
  const entry = visits.get(key);
  if (!entry || now - entry.windowStart > 60_000) { visits.set(key, { windowStart: now, count: 1 }); return false; }
  entry.count++;
  return entry.count > limit;
}

function validAccessCode(given: string | undefined): boolean {
  const expected = process.env.AI_DEMO_CODE;
  if (!expected || !given) return false;
  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin, req.nextUrl.origin)) return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (limited(`${client}:analysis`, 30)) return NextResponse.json({ error: "Too many analyses. Try again shortly." }, { status: 429 });
  try {
    const raw = await req.text();
    if (raw.length > 400000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const input = inputSchema.parse(JSON.parse(raw));
    const sql = inspectSql(input.sql);
    const candidateSql = input.candidateSql?.trim() ? inspectSql(input.candidateSql) : undefined;
    const plan = input.plan?.trim() ? inspectPlan(input.plan) : undefined;
    if (input.candidatePlan?.trim() && !plan) return NextResponse.json({ error: "Provide a baseline plan before a candidate plan." }, { status: 422 });
    const candidatePlan = input.candidatePlan?.trim() ? inspectPlan(input.candidatePlan) : undefined;
    const comparison = plan && candidatePlan ? comparePlans(plan, candidatePlan) : undefined;
    let ai = undefined;
    let aiStatus: "not_requested" | "completed" | "unavailable" | "context_limit" = "not_requested";
    if (input.includeAI) {
      if (!validAccessCode(input.accessCode)) return NextResponse.json({ error: "AI review requires a valid demo access code." }, { status: 403 });
      if (limited(`${client}:ai`, 3)) return NextResponse.json({ error: "AI review limit reached. Try again shortly." }, { status: 429 });
      if (input.sql.length > 8000 || (input.schema?.length ?? 0) > 3000 || (input.plan?.length ?? 0) > 60000) aiStatus = "context_limit";
      else {
        try { ai = await reviewWithAI(input.sql, sql, plan, input.schema); aiStatus = "completed"; }
        catch { aiStatus = "unavailable"; }
      }
    }
    return NextResponse.json({ sql, candidateSql, plan, candidatePlan, comparison, ai, aiStatus, analyzedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Input failed validation.", details: error.issues.map(issue => ({ path: issue.path, message: issue.message })) }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request must be valid JSON." }, { status: 400 });
    if (error instanceof Error && (error.message.startsWith("PostgreSQL parser") || error.message.startsWith("Analyze one") || error.message.startsWith("This workspace") || error.message.startsWith("Plan ") || error.message.startsWith("Expected PostgreSQL") || error.message.startsWith("SQL structure") || error.message.startsWith("Malformed plan"))) return NextResponse.json({ error: error.message }, { status: 422 });
    return NextResponse.json({ error: "Analysis failed. Please retry." }, { status: 500 });
  }
}
