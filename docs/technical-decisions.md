# QuerySense technical decisions

## Why a website instead of asking a chat model?

SQL text alone does not expose table cardinality, data distribution, existing indexes, or observed runtime. QuerySense gives the developer a repeatable workflow: parse a read-only PostgreSQL query, inspect a real plan supplied by the developer, link findings to plan fields, and compare a candidate plan. The report separates static clues, planner estimates, and measured `EXPLAIN ANALYZE` data. AI can add only hypotheses that cite an existing finding ID.

## Why no automatic “optimized query”?

Textual rewrites can change result semantics or regress performance on another workload. QuerySense instead offers an action and a verification step. Candidate SQL can be recorded and syntax-checked beside the baseline, but the application does not assert semantic equivalence or plan provenance. A developer checks result equality and repeats measured trials before applying any change. The application does not claim a speedup from static SQL or planner cost.

## Why paste a plan rather than connect to the database?

This avoids handling database credentials and executing untrusted SQL. The user runs `EXPLAIN (FORMAT JSON)` in their own client and may paste the result. `ANALYZE` is an explicit user choice because it executes the query. Plans may contain sensitive filter literals; the UI asks users to redact them. No plan is retained server-side.

## Why optional, gated AI?

Deterministic analysis must work without a provider key. The optional server-side Gemini call requires both an environment key and a demo access code, uses input limits and an abort signal, requests structured JSON, validates it with Zod, and discards hypotheses with unknown evidence IDs. Provider failure does not become a mocked success. In-process rate limits control a single deployment process; paid public AI would require distributed quotas, identity, monitoring, and a budget policy.

## Why browser-local history?

The previous anonymous SQLite history exposed every visitor's saved SQL. Current analysis is stateless; users explicitly save inputs in localStorage, up to 25 entries, and can export the report as Markdown. This does not provide cross-device sync. The old database remains locally for recovery, but public history and share endpoints return HTTP 410 and the database has been removed from future Git tracking.

## What is “production ready” here?

The deterministic app builds and runs without external services. A public deployment still needs hosting configuration, HTTPS, rate-limit infrastructure if AI is enabled, error monitoring, privacy policy decisions, and review of any historical SQLite data committed in Git. No claim of benchmarked SQL improvement or validated model output is made without real database/provider integration tests.
