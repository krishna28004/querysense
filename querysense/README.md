# QuerySense

QuerySense is a hackathon-ready SQL optimization copilot for PostgreSQL queries.
Paste a query, run hybrid analysis (rule engine + AI reasoning), and get:

- optimization score and severity
- bottleneck breakdown with confidence
- before/after SQL diff
- estimated rows, latency, and complexity improvements
- persisted local history for demos

## Problem

SQL queries often work in development but fail at scale due to hidden full scans,
bad joins, correlated subqueries, and missing limits.
QuerySense makes these issues visible in seconds and suggests practical fixes.

## How It Works

1. Frontend captures SQL and optional schema context.
2. `/api/analyze` runs deterministic rules.
3. AI semantic analyzer proposes deeper optimizations.
4. Merger deduplicates findings and computes final score.
5. Results and metadata are shown in an explainable dashboard and saved to SQLite.

## Key Demo Features

- Interactive onboarding: paste SQL -> optimize
- One-click demo query loader
- Animated execution timeline (Analyze, Detect, Optimize, Score, Complete)
- Animated SQL transformation preview
- Success celebration for strong optimization results
- Live performance gain card (Rows, Latency, Complexity)
- Trust metadata layer:
  - confidence
  - reasoning source
  - execution timestamp
  - detected by (Rule Engine / AI / Hybrid)
  - why this suggestion
  - AI disclaimer for estimated metrics
- Hackathon evaluation section:
  - Problem
  - How it works
  - Architecture modal
  - Innovation card
  - Impact metrics
  - Future roadmap

## Architecture

UI -> Analyze API -> Rule Engine + AI -> Merger/Scorer -> SQLite History

Core paths:

- `app/page.tsx`
- `app/api/analyze/route.ts`
- `lib/analyzer/rules.ts`
- `lib/analyzer/ai.ts`
- `lib/analyzer/merger.ts`
- `app/api/history/route.ts`

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Prisma + SQLite
- OpenAI API
- Monaco Editor

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
OPENAI_API_KEY=your_key_here
```

If missing, QuerySense runs in mock demo mode.

3. Run development server:

```bash
npm run dev
```

4. Build for production check:

```bash
npm run build
```

## Screenshots Checklist

- [ ] Landing + onboarding card
- [ ] SQL editor with sample loaded
- [ ] Execution timeline in progress
- [ ] Results dashboard with score + metrics
- [ ] SQL diff view
- [ ] Trust metadata (confidence/source/disclaimer)
- [ ] Architecture modal
- [ ] History page with stored analyses

## Deployment Checklist

- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] `OPENAI_API_KEY` set in environment (or documented mock mode)
- [ ] Prisma SQLite file available on host filesystem
- [ ] Demo sample query works end-to-end
- [ ] Links and navigation validated on mobile + desktop

## Submission Description

QuerySense turns raw SQL into a concise performance intelligence report.
It combines deterministic rules and AI reasoning to highlight bottlenecks,
show optimized SQL, estimate impact, and provide transparent trust metadata.
Designed for developers, reviewers, and hackathon judges who need fast,
credible query optimization demos without database connectivity.

## 3-Minute Pitch

1. The pain: SQL that looks fine in dev can crush production performance.
2. The product: QuerySense analyzes SQL instantly with hybrid intelligence.
3. The demo: paste query, run timeline, inspect issues, compare SQL diff.
4. The credibility: confidence score, reasoning source, detector type, timestamp,
   and explicit AI disclaimer.
5. The impact: measurable reductions in rows scanned, latency, and complexity.
6. The vision: evolve into continuous query quality checks in developer workflows.

## Judge Q&A

### Hard Question 1
How is this not just an LLM wrapper?

Answer:
It is hybrid by design. Deterministic rules guarantee consistent detection for known anti-patterns,
while AI adds semantic improvements. The merger deduplicates and scores across both sources.

### Hard Question 2
How reliable are performance claims?

Answer:
Metrics are explicitly labeled as estimates and paired with an AI disclaimer.
We expose confidence and source metadata and recommend validating with EXPLAIN ANALYZE.

### Hard Question 3
What happens if OpenAI is unavailable?

Answer:
The app degrades gracefully using rule-engine output and mock/fallback analysis,
keeping the demo and baseline value functional offline.

### Hard Question 4
What is technically innovative here?

Answer:
The innovation is not one model call. It is the explainable hybrid pipeline,
traceable metadata, and optimized demo UX that turns query tuning into a fast,
auditable developer decision flow.
