import { describe, expect, it } from "vitest";
import { inspectSql } from "./diagnostics";

describe("SQL inspection contract", () => {
  it("finds a wildcard projection without claiming measured performance", () => {
    const result = inspectSql("SELECT * FROM orders WHERE status = 'open'");
    expect(result.findings.some(item => item.id === "select-star")).toBe(true);
    expect(result).not.toHaveProperty("executionTimeMs");
  });
  it("does not mistake a string literal for a wildcard projection", () => {
    expect(inspectSql("SELECT 'SELECT *' AS note FROM orders").findings).toHaveLength(0);
  });
  it("rejects malformed, mutating, and multiple statements", () => {
    expect(() => inspectSql("SELECT FROM")).toThrow();
    expect(() => inspectSql("DELETE FROM orders")).toThrow(/read-only SELECT/);
    expect(() => inspectSql("SELECT 1; SELECT 2")).toThrow(/one SQL statement/);
  });
  it("recognizes a CTE as a supported single SELECT", () => {
    const result = inspectSql("WITH recent AS (SELECT id FROM orders) SELECT * FROM recent");
    expect(result.statement).toBe("PostgreSQL SELECT");
    expect(result.findings.some(item => item.id === "select-star")).toBe(true);
  });
  it("accepts one statement with a trailing semicolon", () => {
    expect(inspectSql("SELECT * FROM orders;").findings.some(item => item.id === "select-star")).toBe(true);
  });
  it("rejects SELECT-shaped statements that write data", () => {
    expect(() => inspectSql("WITH u AS (UPDATE orders SET id=1 RETURNING id) SELECT * FROM u")).toThrow(/data-modifying CTE/);
    expect(() => inspectSql("SELECT * INTO temp_orders FROM orders")).toThrow(/SELECT INTO/);
  });
  it("flags a leading wildcard only when it is a literal predicate", () => {
    const result = inspectSql("SELECT id FROM users WHERE name ILIKE '%smith'");
    expect(result.findings.some(item => item.id === "leading-wildcard")).toBe(true);
  });
  it("detects a function wrapped column in a WHERE predicate", () => {
    const result = inspectSql("SELECT id FROM users WHERE LOWER(email) = 'x'");
    expect(result.findings.some(item => item.id === "function-filter")).toBe(true);
  });
  it("reports an explicit cross join", () => {
    expect(inspectSql("SELECT a.id FROM a CROSS JOIN b").findings.some(item => item.id === "cross-join")).toBe(true);
  });
  it("reports deep offset pagination", () => {
    expect(inspectSql("SELECT id FROM orders ORDER BY id LIMIT 25 OFFSET 2000").findings.some(item => item.id === "large-offset")).toBe(true);
  });
});
