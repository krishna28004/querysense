import { describe, it, expect } from 'vitest';
import { nonSargableLowerRule } from './index';

describe('nonSargableLowerRule', () => {
  it('detects LOWER() on a column in WHERE clause', () => {
    const context = {
      rawQuery: "SELECT * FROM users WHERE LOWER(email) = 'test@example.com'",
      normalizedQuery: "SELECT * FROM users WHERE LOWER(email) = ''"
    };
    const results = nonSargableLowerRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/LOWER\(email\)/i);
  });

  it('does not detect LOWER in column names', () => {
    const context = {
      rawQuery: "SELECT lower_bound FROM users",
      normalizedQuery: "SELECT lower_bound FROM users"
    };
    const results = nonSargableLowerRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
