import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const excessiveOffsetRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-SRT-001',
    name: 'Excessive Offset Pagination',
    category: 'Sorting',
    severity: 'Medium',
    estimatedImpact: 'Medium',
    fixPriority: 3,
    tags: ['Performance', 'Pagination', 'Latency'],
  },
  evaluate(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match OFFSET followed by a number
    const regex = /\bOFFSET\s+(\d+)/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];
      const offsetValue = parseInt(match[1], 10);

      if (offsetValue >= 10000) {
        results.push({
          matchedSegment: fullMatch,
          evidence: {
            metadata: this.metadata,
            matchedSegment: fullMatch,
            whyDetected: `Detected an OFFSET value of ${offsetValue}, which exceeds 10000.`,
            whyMatters: 'Using large OFFSET values forces the database engine to compute, fetch, and discard thousands of rows before returning the requested page, leading to severe latency degradation.',
            recommendation: 'Implement Keyset Pagination (cursor-based pagination) using an indexed sequential column instead of OFFSET.',
            confidence: 'High',
            confidenceReason: 'Syntax-level anti-pattern that universally degrades performance at depth.',
            safeRewrite: {
              from: `${fullMatch}`,
              to: `WHERE [indexed_column] > [last_seen_value]`,
              rewriteConfidence: 'Review' // Requires application state to track the cursor
            }
          }
        });
      }
    }

    return results;
  }
};
