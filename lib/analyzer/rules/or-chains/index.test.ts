import { describe, it, expect } from 'vitest';
import { QueryAnalyzer } from '../../core/index';

describe('orChainsRule', () => {
  const analyzer = new QueryAnalyzer();

  it('detects an OR chain with 3 or more conditions on the same column', () => {
    const sql = "SELECT * FROM users WHERE role = 'admin' OR role = 'moderator' OR role = 'staff'";
    const report = analyzer.analyze(sql);
    const results = report.health.findings.filter(f => f.evidence.metadata.ruleCode === 'QS-FLT-006');
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/role\s*=\s*'admin'/i);
  });

  it('does not detect an OR chain with 2 conditions', () => {
    const sql = "SELECT * FROM users WHERE role = 'admin' OR role = 'moderator'";
    const report = analyzer.analyze(sql);
    const results = report.health.findings.filter(f => f.evidence.metadata.ruleCode === 'QS-FLT-006');
    expect(results).toHaveLength(0);
  });

  it('does not detect OR chains on different columns', () => {
    const sql = "SELECT * FROM users WHERE role = 'admin' OR status = 'active' OR age = 30";
    const report = analyzer.analyze(sql);
    const results = report.health.findings.filter(f => f.evidence.metadata.ruleCode === 'QS-FLT-006');
    expect(results).toHaveLength(0);
  });
});
