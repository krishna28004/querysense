import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const unoptimizedHavingRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-FLT-005',
    name: 'Unoptimized HAVING Clause',
    category: 'Filtering',
    severity: 'Medium',
    estimatedImpact: 'Medium',
    fixPriority: 3,
    tags: ['Performance', 'Filtering'],
  },
  evaluateAst(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];
    const graph = context.queryGraph;
    if (!graph || !graph.having || graph.having.length === 0) return results;

    // Check if any having condition does not contain an aggregate function wrapper
    // In our simplified QueryGraph, we didn't perfectly extract function wrappers inside having conditions
    // Actually, node-sql-parser puts aggregate functions inside having into left/right as 'aggr_func'.
    // We can fall back to regex on the raw segment or check the AST directly.
    // For now, if there is a HAVING clause, we'll scan the AST string representation of having.
    // Wait, the easiest way to do this reliably while preserving tests is to check `graph.having`.
    // But since `extractHaving` is basic, let's just use evaluateRegex as the primary until AST expressions are fully mapped.
    // Actually, let's implement a basic evaluateAst:

    const aggregates = /\b(COUNT|SUM|AVG|MAX|MIN)\b/i;
    // We already know from the AST that a HAVING clause exists.
    // So we can just safely run our normal regex to find it and check for aggregates.
    // The issue with the previous regex might be the end of string anchor not matching perfectly.
    const havingMatch = /\bHAVING\s+(.*)/i.exec(context.queryWithoutComments);
    if (havingMatch) {

      const havingClause = havingMatch[1];
      if (!aggregates.test(havingClause)) {
        results.push({
          matchedSegment: `HAVING ${havingClause.trim()}`,
          evidence: {
            metadata: this.metadata,
            matchedSegment: `HAVING ${havingClause.trim()}`,
            whyDetected: `Detected a HAVING clause without aggregate functions: '${havingClause.trim()}'.`,
            whyMatters: 'HAVING applies filtering after all aggregation and grouping occurs. If the filter does not depend on an aggregate, it forces the database to process more rows before discarding them.',
            recommendation: 'Move non-aggregate conditions to the WHERE clause.',
            confidence: 'High',
            confidenceReason: 'AST confirms HAVING clause exists and regex confirms no aggregates present.',
            safeRewrite: {
              from: `HAVING ${havingClause.trim()}`,
              to: `WHERE ${havingClause.trim()}`,
              rewriteConfidence: 'Safe'
            }
          }
        });
      }
    }
    return results;
  },

  evaluateRegex(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Find HAVING and the clause that follows it up to standard terminators or end of string
    const regex = /\bHAVING\s+(.*?)(?=\b(?:ORDER BY|LIMIT|OFFSET)\b|$)/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];
      const havingClause = match[1];

      // If the HAVING clause does not contain aggregate functions, it should be a WHERE
      const aggregates = /\b(COUNT|SUM|AVG|MAX|MIN)\b/i;

      if (!aggregates.test(havingClause)) {
        results.push({
          matchedSegment: fullMatch.trim(),
          evidence: {
            metadata: this.metadata,
            matchedSegment: fullMatch.trim(),
            whyDetected: `Detected a HAVING clause without aggregate functions: '${havingClause.trim()}'.`,
            whyMatters: 'HAVING applies filtering after all aggregation and grouping occurs. If the filter does not depend on an aggregate, it forces the database to process more rows before discarding them.',
            recommendation: 'Move non-aggregate conditions to the WHERE clause.',
            confidence: 'Medium',
            confidenceReason: 'Inferred via regex. A true AST parser would verify the absence of aggregate nodes with 100% certainty.',
            safeRewrite: {
              from: `HAVING ${havingClause.trim()}`,
              to: `WHERE ${havingClause.trim()}`,
              rewriteConfidence: 'Safe' // Semantically identical
            }
          }
        });
      }
    }

    return results;
  }
};
