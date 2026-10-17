import { describe, it, expect } from 'vitest';
import { nonSargableDateRule } from './index';

describe('nonSargableDateRule', () => {
  it('detects DATE() on a column in WHERE clause', () => {
    const context = {
      rawQuery: "SELECT * FROM users WHERE DATE(created_at) = '2025-01-01'",
      normalizedQuery: "SELECT * FROM users WHERE DATE(created_at) = ''"
    };
    const results = nonSargableDateRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/DATE\(created_at\)/i);
  });

  it('does not detect DATE in column names', () => {
    const context = {
      rawQuery: "SELECT date_of_birth FROM users",
      normalizedQuery: "SELECT date_of_birth FROM users"
    };
    const results = nonSargableDateRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
