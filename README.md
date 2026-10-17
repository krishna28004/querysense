# QuerySense / Lab

An evidence-led PostgreSQL query diagnosis workspace built with Next.js 16, React 19, TypeScript, `node-sql-parser`, Zod, and optional Google Gemini. The active app is this directory (`queryPilot/querysense`). The nested `querysense/` directory is a legacy duplicate and should not be used as the deployment root.

## What works

- Parse one PostgreSQL `SELECT` (including supported CTEs) and reject malformed, multi-statement, or mutating input.
- Surface conservative structural findings such as wildcard projection, cross join, deep offset, and leading-wildcard search.
- Read pasted PostgreSQL `EXPLAIN (FORMAT JSON)` plans. Distinguish estimated plans from `ANALYZE` plans, display the plan tree, and flag large row-estimate errors, filtered sequential scans, and disk-spilling sorts where their evidence fields exist.
- Inspect more plan evidence per node, including loops, cost units, filters, index conditions, shared-buffer hits/reads, temp I/O, sort method/space, and hash batches when present in the supplied plan.
- Import a `pg_stat_statements` CSV locally in the browser and rank query shapes by total time, mean time, call count, or shared block reads. The file is not uploaded or persisted; imported SQL may still contain sensitive text, so sanitize it before loading.
- Provide an observation, action, and verification step for every finding. Record optional candidate SQL (syntax-checked) and paste a candidate plan to compare measured execution times or estimated planner costs. Export a Markdown report. Explicitly save up to 25 input sets in browser storage; nothing is written to the application database.
- Optionally request a Gemini review. The server validates structured output, allows at most three hypotheses, and only keeps hypotheses that cite a finding ID. It does not generate SQL rewrites or performance numbers.

QuerySense does not execute SQL, connect to a target database, discover existing indexes, prove an index will help, verify that candidate SQL returns the same rows, verify plan provenance, or benchmark rewritten queries. A pasted `EXPLAIN ANALYZE` plan was measured by the user's PostgreSQL instance, not by QuerySense. PostgreSQL planner cost is an estimate in arbitrary units, not elapsed milliseconds.

## Local setup

Use Node.js 20.9+ and npm. From this directory:

```bash
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

No database setup or migration is needed for the current product. The `prisma/` directory and old analyzer components are legacy artifacts. Existing SQLite data is intentionally left intact but is no longer served by public endpoints.

The workbench is at `/editor`. A worked example is available in the UI, or at `/editor?sample=orders`. The example plan is illustrative; its numbers are fixture data. For a real query, run `EXPLAIN (FORMAT JSON) SELECT ...` in your own PostgreSQL client and paste the JSON. Use `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` only in a safe environment: `ANALYZE` executes the query. Check result equality and production-like data before deploying any rewrite or index.

## Optional AI review

Set `GOOGLE_API_KEY` and a strong `AI_DEMO_CODE` in server environment variables. `GOOGLE_MODEL` defaults to `gemini-2.5-flash`. Both the model key and access code stay server-side; users enter the demo code when opting in. The code is not saved to browser storage. When enabled, supplied SQL, optional schema text, and plan summary are sent to Google. If the provider is unavailable, the deterministic report still renders and AI shows as unavailable. There is no mocked provider response.

The access code and in-process request limits are suitable for a controlled demo on a single server. For a public production deployment with AI enabled, add a durable distributed rate limiter, quotas, abuse monitoring, and a proper identity/billing policy. Otherwise, leave AI unconfigured and use the core deterministic workflow.

## Architecture

```text
Browser workbench ──POST /api/analyze──> Zod input bounds
                                     ├── PostgreSQL AST inspection
                                     ├── optional JSON plan inspection
                                     └── optional gated Gemini hypotheses
                   <── evidence report ──┘

Browser localStorage <── explicit Save inputs locally
Browser download     <── Export report
```

Analysis requests have size and per-minute limits. The server does not persist SQL, plans, AI results, or access codes. Saved inputs are local to the browser and can be removed from `/history`; browser data removal also deletes them. Reopening a saved input runs a fresh analysis. A report download contains the user's SQL. Anonymous history and public share APIs now return HTTP 410 to prevent exposure of existing legacy records. The old SQLite database remains in the repository and should be removed from a clean release after its data has been reviewed and safely archived.

## Deployment

Set the project root to `querysense/`, install with `npm ci`, and build with `npm run build`. No `DATABASE_URL` is required for the current application. Configure security monitoring, HTTPS, and a distributed limiter before opening paid AI review to the public. The current in-memory limit is per process and is not a global quota on serverless platforms. Plan content may include table names and filter literals; users should redact sensitive values before submission.

## Portfolio explanation

“I built a PostgreSQL diagnostic workbench that separates static SQL analysis from actual planner evidence. It parses and bounds untrusted input, interprets JSON plan nodes, shows the limits of each recommendation, and turns findings into reproducible experiments. AI is optional, gated, and constrained to cite deterministic evidence rather than fabricate speedups.”
