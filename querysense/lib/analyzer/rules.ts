import { Issue } from "./types";

interface Rule {
  id: string;
  category: string;
  severity: "critical" | "warning" | "info";
  weight: number;
  title: string;
  description: string;
  suggestion: string;
  check: (sql: string) => { match: boolean; line?: number };
}

export const DETERMINISTIC_RULES: Rule[] = [
  {
    id: "select-star",
    category: "select_star",
    severity: "warning",
    weight: 10,
    title: "Avoid SELECT * in Production",
    description: "Using SELECT * retrieves all columns from the table. This causes unnecessary network transfer, increases memory footprint, and prevents the database from performing highly efficient index-only scans.",
    suggestion: "Explicitly specify the required column names (e.g., SELECT id, name, created_at) instead of SELECT *.",
    check: (sql: string) => {
      const lines = sql.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/SELECT\s+\*/i.test(lines[i])) {
          return { match: true, line: i + 1 };
        }
      }
      return { match: false };
    },
  },
  {
    id: "missing-where-unsafe",
    category: "missing_where",
    severity: "critical",
    weight: 25,
    title: "Unsafe UPDATE/DELETE (Missing WHERE)",
    description: "Detected an UPDATE or DELETE statement without a WHERE clause. This operation will modify or delete EVERY row in the entire table, which can lead to catastrophic, irreversible data loss.",
    suggestion: "Add a targeted WHERE clause using the primary key or indexed fields to restrict the affected rows.",
    check: (sql: string) => {
      const normalized = sql.trim().toUpperCase();
      const isUpdate = normalized.startsWith("UPDATE");
      const isDelete = normalized.startsWith("DELETE");
      if ((isUpdate || isDelete) && !/\bWHERE\b/i.test(sql)) {
        return { match: true, line: 1 };
      }
      return { match: false };
    },
  },
  {
    id: "missing-where-select",
    category: "missing_where",
    severity: "warning",
    weight: 15,
    title: "Missing WHERE Clause on SELECT",
    description: "Detected a SELECT statement without a WHERE clause. If this table grows large, this query will perform a full table scan, loading all rows into memory and causing severe API latency.",
    suggestion: "Restrict the rows scanned by adding a WHERE clause (e.g., filtering by status, date ranges, or active flag) or at least add a LIMIT clause.",
    check: (sql: string) => {
      const normalized = sql.trim().toUpperCase();
      if (normalized.startsWith("SELECT") && !/\bWHERE\b/i.test(sql) && !/\bLIMIT\b/i.test(sql)) {
        return { match: true, line: 1 };
      }
      return { match: false };
    },
  },
  {
    id: "cartesian-product",
    category: "bad_join",
    severity: "critical",
    weight: 20,
    title: "Implicit Cartesian Product (Cross Join)",
    description: "Detected multiple comma-separated tables in the FROM clause without an accompanying WHERE join condition, or an explicit CROSS JOIN. This creates a Cartesian product, multiplying all rows of both tables together, leading to exponential memory usage and query hang.",
    suggestion: "Rewrite using modern explicit JOIN syntax with an ON condition (e.g., JOIN table2 ON table1.id = table2.table1_id).",
    check: (sql: string) => {
      const lines = sql.split("\n");
      // Check for explicit CROSS JOIN
      for (let i = 0; i < lines.length; i++) {
        if (/\bCROSS\s+JOIN\b/i.test(lines[i])) {
          return { match: true, line: i + 1 };
        }
      }
      // Check for comma join e.g., FROM users u, orders o
      const fromCommaPattern = /\bFROM\s+\w+(?:\s+\w+)?\s*,\s*\w+/i;
      if (fromCommaPattern.test(sql) && !/\bJOIN\b/i.test(sql) && !/\bWHERE\b/i.test(sql)) {
        const match = sql.match(fromCommaPattern);
        if (match && match.index !== undefined) {
          const beforeMatch = sql.substring(0, match.index);
          const lineNum = beforeMatch.split("\n").length;
          return { match: true, line: lineNum };
        }
      }
      return { match: false };
    },
  },
  {
    id: "n-plus-one-subquery",
    category: "n_plus_one",
    severity: "critical",
    weight: 20,
    title: "Correlated Subquery in SELECT Projection",
    description: "Detected a nested SELECT subquery inside the main SELECT columns list. This triggers an N+1 query pattern where the database must execute the inner query once for every single row returned by the outer query.",
    suggestion: "Refactor the query using a LEFT JOIN coupled with a GROUP BY clause to aggregate values in a single database pass.",
    check: (sql: string) => {
      const selectProjectionPattern = /SELECT\s+(?:[\s\S]*?),\s*\(\s*SELECT\s+/i;
      if (selectProjectionPattern.test(sql)) {
        const match = sql.match(selectProjectionPattern);
        if (match && match.index !== undefined) {
          const beforeMatch = sql.substring(0, match.index);
          const lineNum = beforeMatch.split("\n").length;
          return { match: true, line: lineNum + 1 };
        }
      }
      return { match: false };
    },
  },
  {
    id: "missing-limit",
    category: "missing_limit",
    severity: "info",
    weight: 5,
    title: "No LIMIT Clause on SELECT",
    description: "The query does not restrict the number of returned records. If the table size grows significantly, this can result in heavy payload transfers and out-of-memory crashes on your application server.",
    suggestion: "Append a LIMIT clause (e.g., LIMIT 50 or LIMIT 100) to safely paginate or truncate results in user-facing views.",
    check: (sql: string) => {
      const normalized = sql.trim().toUpperCase();
      if (normalized.startsWith("SELECT") && !/\bLIMIT\b/i.test(sql)) {
        return { match: true, line: 1 };
      }
      return { match: false };
    },
  },
  {
    id: "nested-subquery-where",
    category: "nested_subquery",
    severity: "warning",
    weight: 15,
    title: "Subquery in WHERE Clause",
    description: "Detected a nested SELECT subquery inside a WHERE condition (e.g., IN (SELECT...)). This can cause the optimizer to run the subquery repeatedly, leading to poor query execution plans.",
    suggestion: "Refactor the query using an explicit INNER JOIN or utilize a Common Table Expression (CTE) to pre-aggregate/filter the dataset.",
    check: (sql: string) => {
      const lines = sql.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/\bWHERE\b.*?\bIN\s*\(\s*SELECT\b/i.test(lines[i]) || /\bWHERE\b.*?\bEXISTS\s*\(\s*SELECT\b/i.test(lines[i])) {
          return { match: true, line: i + 1 };
        }
      }
      return { match: false };
    },
  },
  {
    id: "leading-wildcard",
    category: "full_table_scan",
    severity: "warning",
    weight: 15,
    title: "Leading Wildcard Search (Non-Indexed LIKE)",
    description: "Detected a LIKE operator comparison starting with a wildcard percent symbol (e.g., '%value%'). Standard B-tree indexes cannot be used for leading-wildcard lookups, forcing the database to perform a slow full table scan.",
    suggestion: "Avoid leading wildcards if possible, or create a trigram index (pg_trgm extension in Postgres) to support faster substring searches.",
    check: (sql: string) => {
      const lines = sql.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/LIKE\s+['"]%/i.test(lines[i])) {
          return { match: true, line: i + 1 };
        }
      }
      return { match: false };
    },
  },
  {
    id: "redundant-distinct",
    category: "redundant_distinct",
    severity: "info",
    weight: 5,
    title: "Potentially Redundant DISTINCT",
    description: "Using SELECT DISTINCT forces the database engine to sort the complete result set and eliminate duplicate entries. This sorting process is highly memory-intensive and creates CPU bottlenecks.",
    suggestion: "Review if duplicate rows are truly possible or harmful. If rows are already unique (e.g. grouped or joined on unique keys), omit DISTINCT to save resources.",
    check: (sql: string) => {
      const lines = sql.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/SELECT\s+DISTINCT\b/i.test(lines[i])) {
          return { match: true, line: i + 1 };
        }
      }
      return { match: false };
    },
  },
  {
    id: "redundant-order-by-subquery",
    category: "redundant_order_by",
    severity: "info",
    weight: 5,
    title: "Redundant ORDER BY inside Subquery",
    description: "Found an ORDER BY clause inside a nested subquery/CTE. Database query optimizers usually ignore sorting within subqueries unless a LIMIT is explicitly declared, rendering this sort operation a waste of compute power.",
    suggestion: "Remove the ORDER BY clause from inside the subquery and perform sorting only in the final, outermost query.",
    check: (sql: string) => {
      // Look for ORDER BY inside parenthesis that doesn't have LIMIT
      const lines = sql.split("\n");
      let inParenthesis = false;
      let parenthesisContent = "";
      let startLine = 1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("(")) {
          inParenthesis = true;
          parenthesisContent = "";
          startLine = i + 1;
        }
        if (inParenthesis) {
          parenthesisContent += " " + line;
        }
        if (line.includes(")")) {
          inParenthesis = false;
          if (/\bORDER\s+BY\b/i.test(parenthesisContent) && !/\bLIMIT\b/i.test(parenthesisContent) && /\bSELECT\b/i.test(parenthesisContent)) {
            return { match: true, line: startLine };
          }
        }
      }
      return { match: false };
    },
  }
];

export function runRuleEngine(sql: string): Issue[] {
  const issues: Issue[] = [];
  
  for (const rule of DETERMINISTIC_RULES) {
    const result = rule.check(sql);
    if (result.match) {
      issues.push({
        id: `rule-${rule.id}-${Math.random().toString(36).substr(2, 5)}`,
        category: rule.category,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        suggestion: rule.suggestion,
        confidence: 1.0,
        source: "rule",
        line: result.line,
      });
    }
  }
  
  return issues;
}
