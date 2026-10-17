import { describe, it, expect } from 'vitest';
import { QueryGraphExtractor } from './extractor';

describe('QueryGraphExtractor', () => {
  const extractor = new QueryGraphExtractor();

  it('extracts basic SELECT with FROM and WHERE', () => {
    const sql = `SELECT id, name FROM users u WHERE u.status = 'active'`;
    const { queryGraph } = extractor.parseAndExtract(sql);

    expect(queryGraph).toBeDefined();
    expect(queryGraph?.tables).toEqual([{ name: 'users', alias: 'u' }]);
    expect(queryGraph?.selectedColumns).toEqual([
      { tableAlias: null, columnName: 'id' },
      { tableAlias: null, columnName: 'name' }
    ]);
    expect(queryGraph?.filters.length).toBe(1);
    expect(queryGraph?.filters[0].operator).toBe('=');
  });

  it('extracts INNER JOIN with ON condition', () => {
    const sql = `SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id`;
    const { queryGraph } = extractor.parseAndExtract(sql);

    expect(queryGraph?.tables.length).toBe(2);
    expect(queryGraph?.joins.length).toBe(1);
    expect(queryGraph?.joins[0].type).toBe('INNER');
    expect(queryGraph?.joins[0].leftTableAlias).toBe('u');
    expect(queryGraph?.joins[0].rightTableAlias).toBe('o');
    expect(queryGraph?.joins[0].conditions[0].operator).toBe('=');
  });

  it('returns gracefully on invalid SQL', () => {
    const sql = `SELECT * FROM WHERE syntax error`;
    const { ast, queryGraph } = extractor.parseAndExtract(sql);

    expect(ast).toBeUndefined();
    expect(queryGraph).toBeUndefined();
  });
});
