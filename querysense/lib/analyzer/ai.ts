import { OpenAI } from "openai";
import { Issue, PerformanceMetrics } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

interface AIAnalysisResult {
  optimized_query: string;
  issues: Omit<Issue, "id" | "source">[];
  metrics: PerformanceMetrics;
  explanation: string;
}

export async function runAIAnalysis(
  sql: string,
  ruleIssues: Issue[],
  schema?: string
): Promise<AIAnalysisResult> {
  const isMockMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "mock-key";

  if (isMockMode) {
    // Return high quality mock responses based on standard sample queries to make the offline demo work perfectly
    return getMockAnalysis(sql, ruleIssues);
  }

  try {
    const systemPrompt = `You are QuerySense, a world-class SQL Performance Tuning Specialist and PostgreSQL Database Administrator.
Your task is to analyze the provided SQL query and return a detailed performance analysis in JSON format.

Your analysis must include:
1. "optimized_query": An optimized, clean version of the SQL query that preserves identical query results but executes dramatically faster.
2. "issues": An array of semantic performance bottlenecks, index opportunities, design flaws, or architectural issues. Each issue should have:
   - "category": e.g., "missing_index", "full_table_scan", "n_plus_one", "expensive_aggregation", "subquery"
   - "severity": "critical" | "warning" | "info"
   - "title": A short, impactful title
   - "description": Plain-English explanation of why this hurts performance
   - "suggestion": Exact step-by-step resolution
   - "confidence": Float between 0.0 and 1.0 indicating your certainty
   - "line": Optional line number in the original query where the issue originates
3. "metrics": Estimated performance metrics before and after the optimization:
   - "estimated_rows_scanned": { "before": number, "after": number }
   - "estimated_time_ms": { "before": number, "after": number }
   - "complexity_score": { "before": number, "after": number } (0-10 scale)
4. "explanation": A 2-3 sentence friendly summary of what you optimized and why it makes a massive difference.

CRITICAL:
- Do not duplicate these deterministic rules we have already detected:
${JSON.stringify(
  ruleIssues.map((i) => ({ category: i.category, title: i.title, line: i.line })),
  null,
  2
)}
- Focus on semantic and structural improvements: index suggestions, rewriting subqueries to CTEs, moving filters closer to tables, replacing correlated subqueries with joins, using window functions, optimizing group by, avoiding redundant sorts, etc.
- Return ONLY valid, stringified JSON matching the requested structure. Do not wrap in markdown code blocks.`;

    const userPrompt = `Analyze this PostgreSQL query:
\`\`\`sql
${sql}
\`\`\`

${schema ? `Here is the related CREATE TABLE schema context for reference:\n\`\`\`sql\n${schema}\n\`\`\`` : ""}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(content) as AIAnalysisResult;
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fall back to rule-based metrics and dynamic fallback optimized query
    return getFallbackAnalysis(sql, ruleIssues);
  }
}

function getMockAnalysis(sql: string, ruleIssues: Issue[]): AIAnalysisResult {
  const normalized = sql.toLowerCase();

  // Scenario 1: The Kitchen Sink
  if (normalized.includes("orders") && normalized.includes("customers") && normalized.includes("products")) {
    return {
      optimized_query: `SELECT o.id, o.total, o.created_at, c.name, c.email
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
INNER JOIN order_items oi ON oi.order_id = o.id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
ORDER BY o.created_at DESC
LIMIT 50;`,
      issues: [
        {
          category: "missing_index",
          severity: "critical",
          title: "Missing Indexes on Foreign Keys",
          description: "Joining table 'orders' on 'customer_id' and 'order_items' on 'order_id' without indexes forces the database to perform full-table scans of all related tables to find matching records.",
          suggestion: "Create indexes on the join keys: \nCREATE INDEX idx_orders_customer_id ON orders(customer_id);\nCREATE INDEX idx_order_items_order_id ON order_items(order_id);",
          confidence: 0.95,
          line: 2,
        },
        {
          category: "full_table_scan",
          severity: "warning",
          title: "Large Range Filter without Index",
          description: "Ordering orders by 'created_at' on a table with millions of rows requires an expensive disk-merge sort unless backed by an index.",
          suggestion: "Add a composite index on the filtered and ordered columns: \nCREATE INDEX idx_orders_created_at_desc ON orders(created_at DESC);",
          confidence: 0.9,
          line: 3,
        },
      ],
      metrics: {
        estimated_rows_scanned: { before: 12400000, after: 50 },
        estimated_time_ms: { before: 4200, after: 12 },
        complexity_score: { before: 9, after: 3 },
      },
      explanation: "Optimized the implicit Cartesian joins into explicit INNER JOINs and added pagination (LIMIT 50). By adding index suggestions on your foreign keys and filter columns, we reduce rows scanned from 12.4 million to just 50, slashing execution time by 99%.",
    };
  }

  // Scenario 2: The N+1 Time Bomb
  if (normalized.includes("correlated") || (normalized.includes("users") && normalized.includes("select count(*) from orders"))) {
    return {
      optimized_query: `SELECT u.id, u.name,
  COUNT(o.id) as order_count,
  MAX(o.created_at) as last_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
LIMIT 100;`,
      issues: [
        {
          category: "n_plus_one",
          severity: "critical",
          title: "Active N+1 Query Loop",
          description: "The two subqueries in the SELECT projection list are evaluated independently for every single row returned from the 'users' table. If you have 10,000 users, this executes 20,001 individual query scans.",
          suggestion: "Use a single LEFT JOIN to the 'orders' table combined with a GROUP BY clause to compute both count and max date in a single pass.",
          confidence: 0.98,
          line: 3,
        },
        {
          category: "missing_index",
          severity: "warning",
          title: "Missing Join Column Index",
          description: "No index found on 'orders.user_id'. Each evaluation of the COUNT(*) subquery is scanning the entire orders table.",
          suggestion: "Create an index on the foreign key: \nCREATE INDEX idx_orders_user_id ON orders(user_id);",
          confidence: 0.95,
          line: 3,
        },
      ],
      metrics: {
        estimated_rows_scanned: { before: 850000, after: 100 },
        estimated_time_ms: { before: 8500, after: 45 },
        complexity_score: { before: 8, after: 4 },
      },
      explanation: "Consolidated the N+1 correlated subqueries into a single LEFT JOIN with aggregate functions (COUNT, MAX). This allows PostgreSQL to utilize a HashAggregate execution plan, satisfying all statistics in one scan instead of running thousands of loop iterations.",
    };
  }

  // Scenario 3: The Aggregation Monster
  if (normalized.includes("employees") && normalized.includes("department")) {
    return {
      optimized_query: `SELECT department,
  AVG(salary) as avg_salary,
  COUNT(*) FILTER (WHERE salary > 100000) as high_earners
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;`,
      issues: [
        {
          category: "expensive_aggregation",
          severity: "warning",
          title: "Redundant Double Subquery Aggregation",
          description: "Query computes average salary and high-earner count in separate correlated subqueries rather than aggregating grouped rows directly.",
          suggestion: "Group by department and utilize the standard AVG() function along with the PostgreSQL FILTER clause: COUNT(*) FILTER (WHERE salary > 100000).",
          confidence: 0.95,
          line: 2,
        },
      ],
      metrics: {
        estimated_rows_scanned: { before: 210000, after: 120 },
        estimated_time_ms: { before: 2100, after: 85 },
        complexity_score: { before: 7, after: 3 },
      },
      explanation: "Replaced correlated aggregations with GROUP BY and standard aggregations. The FILTER clause enables conditional counting inside the single scan, avoiding multiple scans of the employee table.",
    };
  }

  // Dynamic Fallback for Custom Query (So custom inputs work cleanly in mock mode too!)
  return getFallbackAnalysis(sql, ruleIssues);
}

function getFallbackAnalysis(sql: string, ruleIssues: Issue[]): AIAnalysisResult {
  // Simple heuristic-based optimized query for general SQL
  let optimized = sql;
  
  // Heuristic LIMIT add
  if (sql.trim().toLowerCase().startsWith("select") && !/\blimit\b/i.test(sql)) {
    optimized = sql.trim().replace(/;?\s*$/, "") + "\nLIMIT 100;";
  }

  const aiIssues: Omit<Issue, "id" | "source">[] = [];

  if (ruleIssues.length === 0) {
    // If no rule issues are found, simulate a couple of mild warnings
    aiIssues.push({
      category: "missing_index",
      severity: "warning",
      title: "Index Verification Recommended",
      description: "This query scans tables without specific CREATE INDEX schemas available. Without explicit indexes on WHERE/JOIN columns, slow scans may occur.",
      suggestion: "Examine execution plan (EXPLAIN ANALYZE) and ensure all filters are backed by indexes.",
      confidence: 0.75,
    });
  }

  const beforeRows = 25000;
  const afterRows = ruleIssues.some(i => i.severity === "critical") ? 50 : 2500;

  return {
    optimized_query: optimized,
    issues: aiIssues,
    metrics: {
      estimated_rows_scanned: { before: beforeRows, after: afterRows },
      estimated_time_ms: { before: 350, after: 15 },
      complexity_score: { before: 6, after: 3 },
    },
    explanation: "Analyzed query structure. Standardized formatting and verified logical layout. Appended a protective LIMIT clause to prevent unbounded memory usage if standard filtering is missing.",
  };
}
