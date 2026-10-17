import { describe, it, expect } from 'vitest';
import { QueryAnalyzer } from '../../core/index';

describe('unoptimizedHavingRule', () => {
  const analyzer = new QueryAnalyzer();

  it('detects HAVING clause without aggregate functions', () => {
    const sql = "SELECT department, SUM(salary) FROM employees GROUP BY department HAVING department = 'Sales'";
    const report = analyzer.analyze(sql);
    const results = report.health.findings.filter(f => f.evidence.metadata.ruleCode === 'QS-FLT-005');
    expect(results).toHaveLength(1);
    expect(results[0].matchedSegment).toMatch(/HAVING\s+department\s*=\s*'Sales'/i);
  });

  it('does not detect HAVING clause with aggregate functions', () => {
    const sql = "SELECT department, SUM(salary) FROM employees GROUP BY department HAVING SUM(salary) > 100000";
    const report = analyzer.analyze(sql);
    const results = report.health.findings.filter(f => f.evidence.metadata.ruleCode === 'QS-FLT-005');
    expect(results).toHaveLength(0);
  });
});
