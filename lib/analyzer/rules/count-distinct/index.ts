import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const countDistinctRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-AGG-001',
    name: 'Distinct Aggregation (COUNT DISTINCT)',
    category: 'Aggregation',
    severity: 'Medium',
    estimatedImpact: 'Medium',
    fixPriority: 3,
    tags: ['Performance', 'Memory', 'Aggregation'],
  },
  evaluate(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match COUNT(DISTINCT column)
    const regex = /\bCOUNT\s*\(\s*DISTINCT\s+([a-zA-Z0-9_.]+)\s*\)/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];
      const column = match[1];

      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: `Detected COUNT(DISTINCT) on column '${column}'.`,
          whyMatters: 'Counting distinct values requires loading data into memory and performing an expensive sort or hash aggregation.',
          recommendation: 'If exact numbers are not strictly required, use approximate counting functions like HyperLogLog (e.g. APPROX_COUNT_DISTINCT).',
          confidence: 'High',
          confidenceReason: 'Syntax explicitly requests a distinct aggregate count.',
          safeRewrite: {
            from: fullMatch,
            to: `APPROX_COUNT_DISTINCT(${column})`,
            rewriteConfidence: 'Review' // Alters precision, user must explicitly accept semantic change
          }
        }
      });
    }

    return results;
  }
};
