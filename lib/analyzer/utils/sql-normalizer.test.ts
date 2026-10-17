import { describe, it, expect } from 'vitest';
import { normalizeSql } from './sql-normalizer';

describe('normalizeSql', () => {
  it('strips single line comments', () => {
    const sql = `SELECT * FROM users -- This is a comment\nWHERE id = 1`;
    expect(normalizeSql(sql)).toBe(`SELECT * FROM users \nWHERE id = 1`);
  });

  it('strips multi line comments', () => {
    const sql = `SELECT * /* ignoring this */ FROM users`;
    expect(normalizeSql(sql)).toBe(`SELECT *  FROM users`);
  });

  it('strips string literals', () => {
    const sql = `SELECT * FROM users WHERE name = 'John -- Doe'`;
    // We should replace string literals with '' to prevent regex matching inside strings
    expect(normalizeSql(sql)).toBe(`SELECT * FROM users WHERE name = ''`);
  });

  it('handles strings with escaped quotes', () => {
    const sql = `SELECT * FROM users WHERE name = 'O''Connor' AND id = 1`;
    expect(normalizeSql(sql)).toBe(`SELECT * FROM users WHERE name = '' AND id = 1`);
  });

  it('handles strings containing keywords', () => {
    const sql = `SELECT * FROM posts WHERE title = 'SELECT * FROM users'`;
    expect(normalizeSql(sql)).toBe(`SELECT * FROM posts WHERE title = ''`);
  });
});
