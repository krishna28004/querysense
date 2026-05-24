# QuerySense

QuerySense enables developers to paste SQL queries and receive explainable optimization insights through a hybrid analysis pipeline.

## Current Status

We are currently at the **Midpoint Implementation Phase (Day 2)**. The core intelligence engine and API routing are implemented. We are now working on the UI and dashboard integration.

## Implemented

- **Core Engine**: Deterministic SQL rule evaluation
- **AI Integration**: Google Gemini 2.5 Flash semantic analysis
- **API**: `/api/analyze` endpoint for query processing
- **Merger**: Scoring logic and deduplication of optimization findings

## In Progress

- **UI Integration**: Connecting the intelligence engine to the React frontend
- **Dashboard**: Building the animated SQL transformation preview and timeline

## Planned

- **History**: Local SQLite storage for evaluating past queries
- **Trust Metadata Layer**: Confidence scoring and reasoning presentation
- **Final Polish**: Success celebrations and performance gain cards

## Problem

SQL queries often work in development but fail at scale due to hidden full scans, bad joins, correlated subqueries, and missing limits. QuerySense makes these issues visible in seconds and suggests practical fixes.

## Vision (Target MVP)

- Interactive onboarding: paste SQL -> optimize
- One-click demo query loader
- Animated execution timeline (Analyze, Detect, Optimize, Score, Complete)
- Animated SQL transformation preview
- Success celebration for strong optimization results
- Live performance gain card (Rows, Latency, Complexity)

## Architecture

UI -> Analyze API -> Rule Engine + AI -> Merger/Scorer -> SQLite History

Core paths:

- `app/page.tsx`
- `app/api/analyze/route.ts` (Implemented)
- `lib/analyzer/rules.ts` (Implemented)
- `lib/analyzer/ai.ts` (Implemented)
- `lib/analyzer/merger.ts` (Implemented)
- `app/api/history/route.ts`

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Prisma + SQLite
- Google Gemini API
- Monaco Editor

## Development Timeline

- **Day 1**: Architecture
- **Day 2**: Core Intelligence (Current)
- **Day 3**: UI + Submission
