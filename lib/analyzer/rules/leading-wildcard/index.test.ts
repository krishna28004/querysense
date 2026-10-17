import { describe, it, expect } from 'vitest';
import { leadingWildcardRule } from './index';

describe('leadingWildcardRule', () => {
  it('detects LIKE with leading wildcard', () => {
    const context = {
      rawQuery: "SELECT * FROM users WHERE email LIKE '%@gmail.com'",
      normalizedQuery: "SELECT * FROM users WHERE email LIKE ''",
      queryWithoutComments: "SELECT * FROM users WHERE email LIKE '%@gmail.com'"
    };
    const results = leadingWildcardRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/LIKE\s+'%@gmail.com'/i);
  });

  it('detects ILIKE with leading wildcard', () => {
    const context = {
      rawQuery: "SELECT * FROM users WHERE email ILIKE '%test%'",
      normalizedQuery: "SELECT * FROM users WHERE email ILIKE ''",
      queryWithoutComments: "SELECT * FROM users WHERE email ILIKE '%test%'"
    };
    const results = leadingWildcardRule.evaluate(context);
    expect(results).toHaveLength(1);
  });

  it('does not detect LIKE without leading wildcard', () => {
    const context = {
      rawQuery: "SELECT * FROM users WHERE email LIKE 'test@%'",
      normalizedQuery: "SELECT * FROM users WHERE email LIKE ''",
      queryWithoutComments: "SELECT * FROM users WHERE email LIKE 'test@%'"
    };
    const results = leadingWildcardRule.evaluate(context);
    expect(results).toHaveLength(0);
  });

  it('does not detect in comments', () => {
    const context = {
      rawQuery: "SELECT * FROM users -- WHERE email LIKE '%test'",
      normalizedQuery: "SELECT * FROM users ",
      queryWithoutComments: "SELECT * FROM users "
    };
    const results = leadingWildcardRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
