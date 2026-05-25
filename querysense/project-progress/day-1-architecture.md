# Day 1: Architecture Checkpoint

## Problem Statement
Developers and Database Administrators lack a rapid, visually clear way to identify semantic SQL bottlenecks (e.g., N+1 loops, missing indexes) without running complex EXPLAIN ANALYZE traces manually or interpreting raw query plans.

## Architecture Decisions
- **Hybrid Analyzer**: Utilizes a fast deterministic Rule Engine for structural anomalies combined with a Google Gemini 2.5 Flash SDK fallback for complex semantic optimization and reasoning.
- **Local SQLite History**: Opted for a local Prisma-backed SQLite instance to provide instantaneous offline caching of optimization history and ensure data privacy during the hackathon.
- **Client-Side execution**: Moving animations, code diffing, and rendering exclusively to the client components (Next.js App Router) to guarantee maximum interface responsiveness.

## Scope
The scope is strictly limited to the SQL optimization analyzer, diff viewer, metrics, and history dashboard. User authentication, remote production database integrations, and continuous monitoring dashboards are intentionally out of scope for the MVP.

## MVP Goals
- Allow users to paste a complex Postgres SQL query.
- Detect structural and semantic flaws.
- Provide a dramatically optimized version of the SQL.
- Calculate and display a Confidence Score, CPU Reduction Impact, and Database Cost reductions.
- Save requests to a local history state for immediate retrieval.

## Tech Stack
- Next.js (App Router)
- React
- Tailwind CSS
- Framer Motion
- Prisma ORM
- SQLite
- Google Gen AI SDK (Gemini)

