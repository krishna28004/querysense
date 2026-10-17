import { describe, it, expect } from 'vitest';
import { orderByRandRule } from './index';

describe('orderByRandRule', () => {
  it('detects ORDER BY RAND()', () => {
    const context = {
      rawQuery: "SELECT * FROM users ORDER BY RAND() LIMIT 10",
      normalizedQuery: "SELECT * FROM users ORDER BY RAND() LIMIT 10",
      queryWithoutComments: "SELECT * FROM users ORDER BY RAND() LIMIT 10"
    };
    const results = orderByRandRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/ORDER\s+BY\s+RAND\(\)/i);
  });

  it('detects ORDER BY RANDOM()', () => {
    const context = {
      rawQuery: "SELECT * FROM users ORDER BY random() LIMIT 10",
      normalizedQuery: "SELECT * FROM users ORDER BY random() LIMIT 10",
      queryWithoutComments: "SELECT * FROM users ORDER BY random() LIMIT 10"
    };
    const results = orderByRandRule.evaluate(context);
    expect(results).toHaveLength(1);
  });

  it('does not detect regular ORDER BY', () => {
    const context = {
      rawQuery: "SELECT * FROM users ORDER BY id DESC LIMIT 10",
      normalizedQuery: "SELECT * FROM users ORDER BY id DESC LIMIT 10",
      queryWithoutComments: "SELECT * FROM users ORDER BY id DESC LIMIT 10"
    };
    const results = orderByRandRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
