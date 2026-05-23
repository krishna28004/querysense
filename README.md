# QuerySense 🧠⚡

**AI-Powered Database Query Optimizer**

Developers write inefficient SQL queries that lead to slow APIs, high DB costs, poor scalability, and performance bottlenecks. QuerySense is an AI agent that analyzes SQL queries, detects bottlenecks, estimates performance risks, and recommends optimizations *before* deployment.

## 🚀 Features
- **Instant Analysis**: Paste any SQL query and get a comprehensive breakdown.
- **AI Optimization**: Powered by OpenAI, it identifies missing indexes, redundant joins, and full table scans.
- **Before/After Comparisons**: Visually compare your original query with the optimized version.
- **Execution History**: Automatically saves your queries for later review.
- **Beautiful UI**: Built with Next.js 15, Tailwind v4, and Framer Motion.

## 🛠️ Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Prisma (SQLite local, Postgres ready)
- OpenAI API
- Framer Motion
- Monaco Editor

## 🏁 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your OpenAI API Key.
4. Setup database: `npx prisma db push`
5. Start dev server: `npm run dev`

## 🏆 Hackathon Project
Built in under 24 hours. Optimized for speed, developer experience, and actionable insights.
