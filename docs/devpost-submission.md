# 🚀 Devpost Submission: QuerySense

## Inspiration
Every developer has pushed a "quick" SQL query to production only to watch it bring the database to its knees. We were tired of reading execution plans and guessing which index was missing. We wanted a tool that acted like a Senior DBA sitting right next to us, catching mistakes *before* deployment.

## What it does
QuerySense is an AI-powered database query optimizer. You paste your raw SQL into the editor, and our intelligence engine analyzes the structure, detects bottlenecks (like full table scans, N+1 problems, or missing indexes), scores the performance risk, and generates a heavily optimized version of the query with a side-by-side comparison.

## How we built it
We built the app shell using Next.js 15 (App Router) and styled it beautifully with Tailwind CSS v4 and Framer Motion for smooth micro-interactions. The code editor is powered by Monaco Editor for a native IDE feel. The backend uses Next.js API Routes connected to OpenAI's structured outputs to guarantee precise JSON analysis. For persistence, we used Prisma with SQLite (easily swappable to PostgreSQL) to save analysis history.

## Challenges we ran into
One of the biggest challenges was forcing the LLM to consistently return valid, structured JSON for our Next.js frontend to parse into the UI components. We solved this by using strict Zod schemas and OpenAI's structured outputs. We also had to fight with Next.js Turbopack build caching and strict TypeScript constraints for our UI component variants.

## Accomplishments that we're proud of
- Completing a fully functional, production-ready MVP in under 24 hours.
- Achieving a 100% type-safe build with no TypeScript errors.
- Designing a UI that looks and feels like a premium, enterprise-grade SaaS product.

## What we learned
We learned how to integrate Monaco Editor seamlessly into Next.js App Router, how to heavily type-check AI responses, and how to use Framer Motion to make a dashboard feel "alive."

## What's next for QuerySense
In the future, we want to integrate directly into GitHub Actions so QuerySense can review PRs and block merges if a developer tries to introduce a dangerous SQL query into the codebase. We also want to add direct database connection support to run actual EXPLAIN ANALYZE commands.
