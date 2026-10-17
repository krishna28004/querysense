import { describe, it, expect } from 'vitest';
import { nonSargableYearRule } from './index';

describe('nonSargableYearRule', () => {
  it('detects YEAR() on a column in WHERE clause', () => {
    const context = {
      rawQuery: "SELECT * FROM users WHERE YEAR(created_at) = 2025",
      normalizedQuery: "SELECT * FROM users WHERE YEAR(created_at) = 2025"
    };
    const results = nonSargableYearRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/YEAR\(created_at\)/i);
  });

  it('detects year() case insensitive', () => {
    const context = {
      rawQuery: "SELECT * FROM users WHERE yEaR ( created_at ) = 2025",
      normalizedQuery: "SELECT * FROM users WHERE yEaR ( created_at ) = 2025"
    };
    const results = nonSargableYearRule.evaluate(context);
    expect(results).toHaveLength(1);
  });

  it('does not detect YEAR in column names', () => {
    const context = {
      rawQuery: "SELECT year_of_birth FROM users",
      normalizedQuery: "SELECT year_of_birth FROM users"
    };
    const results = nonSargableYearRule.evaluate(context);
    expect(results).toHaveLength(0);
  });

  it('does not detect if YEAR is inside a string (normalized out)', () => {
    // In actual execution, the normalizer would have removed the string
    const context = {
      rawQuery: "SELECT * FROM users WHERE status = 'YEAR(foo)'",
      normalizedQuery: "SELECT * FROM users WHERE status = ''"
    };
    const results = nonSargableYearRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
