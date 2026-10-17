import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const nonSargableDateRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-FLT-002',
    name: 'Non-SARGable Date Function (DATE)',
    category: 'Filtering',
    severity: 'High',
    estimatedImpact: 'High',
    fixPriority: 2,
    tags: ['Performance', 'Indexability', 'SARGable'],
  },
  evaluate(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match DATE(column_name)
    const regex = /\bDATE\s*\(\s*([a-zA-Z0-9_.]+)\s*\)/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];
      const column = match[1];

      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: `Detected DATE() function wrapping the column '${column}'.`,
          whyMatters: 'Applying functions to columns in filtering conditions prevents the database from using standard B-tree indexes, forcing a full table scan.',
          recommendation: 'Use explicit date range boundaries instead of date extraction functions.',
          confidence: 'High',
          confidenceReason: 'Syntax-level anti-pattern that universally breaks SARGability regardless of schema.',
          safeRewrite: {
            from: `${fullMatch} = '[YYYY-MM-DD]'`,
            to: `${column} >= '[YYYY-MM-DD]' AND ${column} < '[YYYY-MM-DD] + INTERVAL 1 DAY'`,
            rewriteConfidence: 'Safe'
          }
        }
      });
    }

    return results;
  }
};
