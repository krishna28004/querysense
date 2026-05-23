# 🛡️ Hackathon Judge Defense Guide

When judges visit your table, they will try to poke holes in your project. Use these answers to defend your engineering decisions.

## Q: "Why use AI for this? Can't you just run EXPLAIN ANALYZE on the database?"
**A:** "EXPLAIN ANALYZE requires you to actually run the query against a populated database to get meaningful results. QuerySense shifts this left. It works entirely statically *before* the code is even committed. It catches structural anti-patterns without needing database access, acting as an educational tool for junior developers, not just a diagnostic tool for DBAs."

## Q: "Isn't the OpenAI call slow for a UI?"
**A:** "We optimized the perceived performance by adding an animated execution timeline that shows the steps of the analysis. Next.js API Routes handle the stream/response efficiently, and the structured output format keeps the token count low. The total turnaround is usually under 3 seconds."

## Q: "Why SQLite instead of Postgres for the hackathon?"
**A:** "Speed of execution. Using SQLite allowed us to self-contain the entire application without external database dependencies, meaning anyone can clone the repo and run it immediately without setting up Docker or a Neon DB. However, because we used Prisma, migrating to Postgres is literally a one-line change in the `.env` file."

## Q: "What happens if the LLM hallucinates a bad query?"
**A:** "We mitigated this by strictly enforcing the output schema using Zod. Furthermore, the UI presents the optimized query alongside a detailed 'Reasoning' section. The goal isn't to auto-execute the query blindly, but to present the developer with actionable recommendations that they can review."

## Q: "Is this actually built on Next.js 15? It looks too polished for 24 hours."
**A:** "Yes, we leveraged Next.js App Router and Turbopack for rapid iteration. The polish comes from our strict design system using Tailwind v4 and Framer Motion micro-animations. We didn't waste time reinventing buttons; we focused entirely on the core user flow."
