import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const crossJoinRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-JON-001',
    name: 'Cartesian Product (CROSS JOIN)',
    category: 'Joins',
    severity: 'Critical',
    estimatedImpact: 'High',
    fixPriority: 1,
    tags: ['Performance', 'Joins', 'Cartesian-Product'],
  },

  evaluateAst(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];
    const graph = context.queryGraph;
    if (!graph) return results;

    // Check explicit cross joins
    for (const join of graph.joins) {
      if (join.type.includes('CROSS')) {
        results.push({
          matchedSegment: 'CROSS JOIN',
          evidence: {
            metadata: this.metadata,
            matchedSegment: 'CROSS JOIN',
            whyDetected: `Detected an explicit CROSS JOIN between ${join.leftTableAlias} and ${join.rightTableAlias}.`,
            whyMatters: 'A Cartesian product multiplies every row in the first table by every row in the second table. This causes catastrophic CPU and memory spikes.',
            recommendation: 'Use an INNER JOIN with a valid ON condition to relate the tables correctly.',
            confidence: 'High',
            confidenceReason: 'AST explicitly defines a CROSS JOIN.',
          }
        });
      }
    }

    // Check implicit cross joins (comma separated tables)
    // If there are more tables than (joins + 1), it means some tables were added without a explicit JOIN clause.
    if (graph.tables.length > 1 && graph.joins.length < graph.tables.length - 1) {
       results.push({
          matchedSegment: 'Implicit CROSS JOIN',
          evidence: {
            metadata: this.metadata,
            matchedSegment: 'Implicit CROSS JOIN',
            whyDetected: `Detected ${graph.tables.length} tables but only ${graph.joins.length} explicit JOINs.`,
            whyMatters: 'Comma-separated tables in the FROM clause act as an implicit CROSS JOIN. If the WHERE clause forgets the join condition, it produces a catastrophic Cartesian product.',
            recommendation: 'Use explicit ANSI JOIN syntax (INNER JOIN ... ON ...) to prevent accidental Cartesian products.',
            confidence: 'High',
            confidenceReason: 'AST structurally defines un-joined tables.',
          }
       });
    }

    return results;
  },

  evaluateRegex(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match explicit CROSS JOIN
    const explicitRegex = /\bCROSS\s+JOIN\b/gi;
    let match;

    while ((match = explicitRegex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];
      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: 'Detected an explicit CROSS JOIN keyword.',
          whyMatters: 'A Cartesian product multiplies every row in the first table by every row in the second table (e.g. 10,000 x 10,000 = 100,000,000 rows). This causes catastrophic CPU and memory spikes.',
          recommendation: 'Use an INNER JOIN with a valid ON condition to relate the tables correctly.',
          confidence: 'High',
          confidenceReason: 'Explicit syntax detected.',
        }
      });
    }

    // Match implicit comma joins: FROM a, b
    const implicitRegex = /\bFROM\s+[a-zA-Z0-9_]+(?:\s+(?:AS\s+)?[a-zA-Z0-9_]+)?\s*,\s*[a-zA-Z0-9_]+/gi;

    while ((match = implicitRegex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];
      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: `Detected comma-separated tables in FROM clause: '${fullMatch}'`,
          whyMatters: 'Comma-separated tables in the FROM clause act as an implicit CROSS JOIN. If the WHERE clause forgets the join condition, it produces a catastrophic Cartesian product.',
          recommendation: 'Use explicit ANSI JOIN syntax (INNER JOIN ... ON ...) to prevent accidental Cartesian products.',
          confidence: 'Medium',
          confidenceReason: 'Regex matched comma-separated tables. The WHERE clause might contain the join condition, but ANSI syntax is still preferred.',
        }
      });
    }

    return results;
  }
};
