# QuerySense

**An AI-assisted SQL performance analysis platform.**

## Short Overview

Developers often write inefficient SQL queries that lead to slow APIs, high database costs, poor scalability, and performance bottlenecks. QuerySense is an intelligent agent that analyzes SQL queries, detects structural bottlenecks, estimates performance risks, and recommends targeted optimizations *before* deployment.

## Problem Statement

Bad queries cost organizations thousands of dollars and degrade user experience. By the time a query bottleneck is discovered in production through traditional profiling, the damage is already done. Identifying missing indexes, redundant joins, or full table scans requires deep DBA expertise that many development teams lack during the active coding phase.

## Solution

QuerySense shifts database performance analysis left. It acts as a static analysis tool that integrates directly into the developer workflow, catching structural anti-patterns and performance risks without needing direct database execution or populated tables.

## Why QuerySense?

Unlike traditional database profiling tools that require executing queries against live data to uncover issues, QuerySense proactively analyzes your code as you write it. It bridges the gap between software engineering and database administration, ensuring that performance optimizations are a core part of the development lifecycle rather than an afterthought.

## Key Features

- **Instant Analysis**: Paste any SQL query and get a comprehensive, structured breakdown.
- **AI Optimization**: Identifies missing indexes, redundant joins, and full table scans.
- **Visual Diff Comparisons**: View side-by-side comparisons of your original query against the optimized version.
- **Execution History**: Automatically saves analysis results for team review and knowledge sharing.
- **Beautiful UI**: Highly responsive and intuitive dashboard designed for developer experience.

## QueryVision™

QueryVision™ is a visual intelligence layer that translates SQL execution plans into an interactive timeline. It dynamically breaks down the sequence of query operations to clarify database behavior. This visualization helps developers pinpoint bottlenecks—such as nested loops or missing indexes—and understand the technical rationale behind each AI-driven optimization.

## Architecture

QuerySense relies on a hybrid rule engine combined with AI analysis. The frontend parses user input and handles syntax highlighting, while the backend utilizes structured LLM outputs via strict Zod schemas to guarantee precise JSON responses.

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Monaco Editor
- **Backend**: Next.js API Routes, Google Gemini API (Structured Outputs)
- **Database**: Prisma (SQLite local, PostgreSQL ready)

## How It Works

1. **Input**: Paste your raw SQL query into the Monaco-powered editor.
2. **Analysis**: The intelligence engine parses the structure and identifies anti-patterns.
3. **Recommendation**: QuerySense scores the performance risk and generates a heavily optimized query.
4. **Review**: The developer reviews the optimization rationale and applies the updated SQL.

## Use Cases

- **Code Reviews**: Verify SQL queries in PRs to block dangerous or unoptimized code from merging.
- **Educational Tool**: Help junior developers understand query execution plans and database indexes.
- **Pre-Deployment Checks**: Ensure queries are performant before they ever reach a staging or production database.

## Run Locally

1. Clone the repository: `git clone https://github.com/krishna28004/querysense.git`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your Gemini API Key.
4. Setup database: `npx prisma db push`
5. Start dev server: `npm run dev`

## Project Structure

```
├── app/                  # Next.js app router pages and API
├── components/           # Reusable UI components
├── docs/                 # Documentation and architecture decisions
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## Limitations

- QuerySense performs static analysis and does not have access to live database statistics (like table cardinality), meaning recommendations are structural, not empirical.
- Complex dialect-specific features may require manual review.

## Future Improvements

- Direct integration with GitHub Actions to review PRs automatically.
- Support for live database connections to run actual `EXPLAIN ANALYZE` commands for empirical validation.
- Enhanced dialect support for MySQL, SQL Server, and Oracle.

## Contributing

We welcome contributions! Please open an issue or submit a Pull Request. Make sure to follow the existing code style and ensure all type checks pass.

## License

This project is licensed under the MIT License.
