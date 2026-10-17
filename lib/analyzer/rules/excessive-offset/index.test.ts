import { describe, it, expect } from 'vitest';
import { excessiveOffsetRule } from './index';

describe('excessiveOffsetRule', () => {
  it('detects OFFSET > 10000', () => {
    const context = {
      rawQuery: "SELECT * FROM users ORDER BY created_at DESC OFFSET 15000 LIMIT 10",
      normalizedQuery: "SELECT * FROM users ORDER BY created_at DESC OFFSET 15000 LIMIT 10",
      queryWithoutComments: "SELECT * FROM users ORDER BY created_at DESC OFFSET 15000 LIMIT 10"
    };
    const results = excessiveOffsetRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/OFFSET\s+15000/i);
  });

  it('detects OFFSET >= 10000', () => {
    const context = {
      rawQuery: "SELECT * FROM users OFFSET 10000",
      normalizedQuery: "SELECT * FROM users OFFSET 10000",
      queryWithoutComments: "SELECT * FROM users OFFSET 10000"
    };
    const results = excessiveOffsetRule.evaluate(context);
    expect(results).toHaveLength(1);
  });

  it('does not detect OFFSET < 10000', () => {
    const context = {
      rawQuery: "SELECT * FROM users OFFSET 9999",
      normalizedQuery: "SELECT * FROM users OFFSET 9999",
      queryWithoutComments: "SELECT * FROM users OFFSET 9999"
    };
    const results = excessiveOffsetRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
