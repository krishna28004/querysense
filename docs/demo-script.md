# 🎬 QuerySense Demo Script (3 Minutes)

## 0:00 - The Hook
*(Screen shows a complex, messy SQL query in an IDE or text editor)*
**Speaker:** "We’ve all been here. It’s 2 AM, the API is timing out, and you’re staring at a 50-line SQL query trying to figure out why your database CPU is at 99%. Bad queries cost startups thousands of dollars and kill user experience. But what if you could fix them *before* they hit production?"

## 0:30 - The Introduction
*(Switch to QuerySense Dashboard)*
**Speaker:** "Meet QuerySense. It’s an AI-powered database query optimizer built for developers. Let me show you how it works."

## 0:45 - The Action
*(Paste the messy SQL query into the Monaco Editor)*
**Speaker:** "I just paste my slow query in here. Let's hit 'Analyze Query'. Watch what happens."
*(Click Analyze. Show the loading state, then the animated results popping in)*

## 1:15 - The Insight
*(Scroll through the Analysis section)*
**Speaker:** "In seconds, QuerySense didn’t just format the code. It found the exact bottlenecks. It tells us we're doing a full table scan, missing an index on the `users` table, and using a dangerous `SELECT *`. And here's the best part..."

## 1:45 - The Solution
*(Show the Optimized Query and Before/After Diff)*
**Speaker:** "It wrote the optimized version for us. We can clearly see the differences. Plus, it gives us an exact estimation of our performance risk."

## 2:15 - The History
*(Click on the 'History' tab)*
**Speaker:** "And because we're integrated with Prisma, every query we analyze is saved to our local history so we can review our optimizations over time."

## 2:40 - The Close
**Speaker:** "QuerySense was built using Next.js 15, Tailwind, and OpenAI. It's fast, it's beautiful, and it's ready to save your database from your bad code. Thank you."
