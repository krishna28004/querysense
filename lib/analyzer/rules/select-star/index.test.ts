import { describe, it, expect } from 'vitest';
import { selectStarRule } from './index';

describe('selectStarRule', () => {
  it('detects SELECT *', () => {
    const context = {
      rawQuery: "SELECT * FROM users",
      normalizedQuery: "SELECT * FROM users",
      queryWithoutComments: "SELECT * FROM users"
    };
    const results = selectStarRule.evaluate(context);
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/SELECT\s+\*/i);
  });

  it('detects SELECT table.*', () => {
    const context = {
      rawQuery: "SELECT u.* FROM users u",
      normalizedQuery: "SELECT u.* FROM users u",
      queryWithoutComments: "SELECT u.* FROM users u"
    };
    const results = selectStarRule.evaluate(context);
    expect(results).toHaveLength(1);
  });

  it('detects SELECT * with spacing', () => {
    const context = {
      rawQuery: "SELECT\n  *  \nFROM users",
      normalizedQuery: "SELECT\n  *  \nFROM users",
      queryWithoutComments: "SELECT\n  *  \nFROM users"
    };
    const results = selectStarRule.evaluate(context);
    expect(results).toHaveLength(1);
  });

  it('does not detect SELECT count(*)', () => {
    const context = {
      rawQuery: "SELECT COUNT(*) FROM users",
      normalizedQuery: "SELECT COUNT(*) FROM users",
      queryWithoutComments: "SELECT COUNT(*) FROM users"
    };
    const results = selectStarRule.evaluate(context);
    expect(results).toHaveLength(0);
  });

  it('does not detect SELECT explicit columns', () => {
    const context = {
      rawQuery: "SELECT id, name FROM users",
      normalizedQuery: "SELECT id, name FROM users",
      queryWithoutComments: "SELECT id, name FROM users"
    };
    const results = selectStarRule.evaluate(context);
    expect(results).toHaveLength(0);
  });
});
