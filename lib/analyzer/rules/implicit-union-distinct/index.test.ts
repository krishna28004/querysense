import { describe, it, expect } from 'vitest';
import { implicitUnionDistinctRule } from './index';

describe('implicitUnionDistinctRule', () => {
  it('detects UNION without ALL', () => {
    const context = {
      rawQuery: "SELECT id FROM users UNION SELECT id FROM admins",
      normalizedQuery: "SELECT id FROM users UNION SELECT id FROM admins",
      queryWithoutComments: "SELECT id FROM users UNION SELECT id FROM admins"
    };
    const results = implicitUnionDistinctRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/UNION/i);
  });

  it('does not detect UNION ALL', () => {
    const context = {
      rawQuery: "SELECT id FROM users UNION ALL SELECT id FROM admins",
      normalizedQuery: "SELECT id FROM users UNION ALL SELECT id FROM admins",
      queryWithoutComments: "SELECT id FROM users UNION ALL SELECT id FROM admins"
    };
    const results = implicitUnionDistinctRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
