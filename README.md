# QuerySense

QuerySense is a PostgreSQL query workbench for answering a more useful question than “Can this SQL be rewritten?”: **what is the database actually doing, and what should I test next?**

Paste a `SELECT` query to inspect its structure. Add a PostgreSQL JSON execution plan when you have one, and the report can point to the scans, estimates, filters, and I/O behind its findings. You can then edit a candidate query, compare the SQL side by side, and bring back a second plan to evaluate the experiment.

QuerySense never runs your SQL or connects to your database. It also does not promise that a rewrite or index will be faster. The final check belongs in PostgreSQL, with representative data and a result-set comparison.

## Why this exists

Advice based only on SQL text can be useful, but it cannot tell you which plan PostgreSQL chose for *your* tables and data. QuerySense keeps those two kinds of evidence separate:

- **SQL inspection** finds structural patterns, such as `SELECT *`, a cross join, deep `OFFSET`, or a leading-wildcard search. These are clues, not measured bottlenecks.
- **Plan inspection** reads a JSON plan you generated in PostgreSQL. It can show the actual access path, row-estimate mismatches, filter counters, buffers, and spill indicators when the plan contains them.
- **Candidate comparison** puts your original and edited SQL side by side. If you provide both plans, it compares like-for-like metrics; it does not assume the two queries return the same rows.

Each finding links an observation to a suggested next step and a way to check it. The score on the report is a count-weighted structural signal, **not** a speed benchmark or a safety grade.

## Run it locally

You need Node.js 20.9+ and npm. From the repository root:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000/editor](http://localhost:3000/editor). No database, migration, or API key is required for the core analysis.

To check the project before a change or deployment:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run build` followed by `npm run start` runs the production build locally.

## Try a query

1. Click **Load sample query** and **Analyze query**. The button cycles through five examples. The first includes an illustrative plan; its timing and row counts are fixture values, not measurements from your database.
2. For your own query, run `EXPLAIN (FORMAT JSON)` in a PostgreSQL client and paste the result into **PostgreSQL execution plan**. Use `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` only where it is safe to execute the query—`ANALYZE` really runs it.
3. Review the report's severity signals, plan metrics, and individual findings. Open a finding's evidence to see why it was raised and how to validate it.
4. Click **Build optimized draft** to copy your SQL into an editable candidate. This does **not** generate an automatic rewrite. Make a targeted change, check its syntax, and inspect the before/after diff.
5. If you have a plan for the candidate, paste it into **Candidate experiment** and compare it with the baseline. Check result equality, parameter cases, and performance on representative data before shipping a change.

You can also import a `pg_stat_statements` CSV to rank query shapes by total time, mean time, calls, or shared block reads. That triage happens in the browser; the CSV is not uploaded or saved by QuerySense.

## Optional AI review

The deterministic report works without AI. To enable the opt-in Gemini review for a controlled demo, set these server-side environment variables:

```text
GOOGLE_API_KEY=...
AI_DEMO_CODE=...
GOOGLE_MODEL=gemini-2.5-flash
```

See [`.env.example`](.env.example) for the full example. The demo code gates requests; it is not a user account system. When a user opts in, their SQL, optional schema context, and plan summary are sent to Google. The server accepts at most three structured hypotheses and keeps only those tied to an existing finding. AI review does not write SQL for you or invent performance numbers. If the provider fails, the non-AI report still appears.

Do not enable the AI endpoint for unrestricted public traffic with only the current in-memory limit. A public service needs a distributed rate limiter, quotas, monitoring, and an identity or billing policy.

## Where the data goes

- Analysis requests are validated and processed on the server, but QuerySense does not persist the SQL or plan in its application database.
- **Save inputs locally** stores up to 25 input sets in this browser's local storage. Saved work is not synced across devices; clearing browser data removes it.
- **Export report** downloads a Markdown file containing your SQL and findings. Treat that file as sensitive if the query contains private names or literals.
- The workload CSV stays in the browser. Plans and SQL submitted for analysis still pass through the server, so redact sensitive literals before pasting them.
- Legacy anonymous history and public sharing endpoints return HTTP 410; they do not expose the old stored records.

## Implementation at a glance

| Part | What it does |
| --- | --- |
| Next.js workbench | SQL input, plan input, visual report, candidate diff, local saved work |
| `/api/analyze` | Bounds and validates requests with Zod; applies per-process request limits |
| SQL inspector | Parses a single PostgreSQL `SELECT` and reports conservative structural findings |
| Plan inspector | Reads pasted PostgreSQL JSON plans; distinguishes estimates from measured `ANALYZE` fields |
| Optional Gemini review | Produces evidence-linked hypotheses behind a demo access code |

The app uses Next.js 16, React 19, TypeScript, `node-sql-parser`, Zod, and an optional Google Gemini integration. Tests cover SQL inspection, plan handling, AI response checks, workload parsing, and selected UI behavior.

## Deployment and limits

Deploy from the **repository root**, using `npm ci` and `npm run build`. The nested `querysense/` directory is an older copy of the project, not the active app. The current workflow needs no `DATABASE_URL` or Prisma migration. The legacy SQLite database is still tracked in the repository; review and archive its contents before removing it from a future clean release.

The current request limit lives in server memory, so it is not a global quota across serverless instances. Use HTTPS and production-grade abuse controls before exposing AI review publicly. SQL parsing supports the implemented PostgreSQL `SELECT` subset, not every dialect or statement. QuerySense cannot discover your existing indexes, verify plan provenance, prove two queries are equivalent, or benchmark a rewrite on its own.

That boundary is deliberate: the useful output is a testable explanation, not an unsupported “100% faster” claim.
