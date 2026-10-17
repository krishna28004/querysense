import { describe, it, expect } from 'vitest';
import { countDistinctRule } from './index';

describe('countDistinctRule', () => {
  it('detects COUNT(DISTINCT col)', () => {
    const context = {
      rawQuery: "SELECT COUNT(DISTINCT user_id) FROM users",
      normalizedQuery: "SELECT COUNT(DISTINCT user_id) FROM users",
      queryWithoutComments: "SELECT COUNT(DISTINCT user_id) FROM users"
    };
    const results = countDistinctRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/COUNT\(\s*DISTINCT\s+user_id\s*\)/i);
  });

  it('detects case insensitive', () => {
    const context = {
      rawQuery: "SELECT count( distinct id ) FROM users",
      normalizedQuery: "SELECT count( distinct id ) FROM users",
      queryWithoutComments: "SELECT count( distinct id ) FROM users"
    };
    const results = countDistinctRule.evaluate(context);
    expect(results).toHaveLength(1);
  });

  it('does not detect regular COUNT', () => {
    const context = {
      rawQuery: "SELECT COUNT(id) FROM users",
      normalizedQuery: "SELECT COUNT(id) FROM users",
      queryWithoutComments: "SELECT COUNT(id) FROM users"
    };
    const results = countDistinctRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
