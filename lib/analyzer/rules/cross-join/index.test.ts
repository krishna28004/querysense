import { describe, it, expect } from 'vitest';
import { QueryAnalyzer } from '../../core/index';

describe('crossJoinRule', () => {
  const analyzer = new QueryAnalyzer();

  it('detects explicit CROSS JOIN', () => {
    const sql = "SELECT * FROM users CROSS JOIN admins";
    const report = analyzer.analyze(sql);
    const results = report.health.findings.filter(f => f.evidence.metadata.ruleCode === 'QS-JON-001');
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/CROSS JOIN/i);
  });

  it('detects implicit cross join (comma separated FROM without WHERE condition)', () => {
    const sql = "SELECT * FROM users, admins";
    const report = analyzer.analyze(sql);
    const results = report.health.findings.filter(f => f.evidence.metadata.ruleCode === 'QS-JON-001');
    expect(results).toHaveLength(1);
  });

  it('does not detect INNER JOIN', () => {
    const sql = "SELECT * FROM users INNER JOIN admins ON users.id = admins.user_id";
    const report = analyzer.analyze(sql);
    const results = report.health.findings.filter(f => f.evidence.metadata.ruleCode === 'QS-JON-001');
    expect(results).toHaveLength(0);
  });
});
