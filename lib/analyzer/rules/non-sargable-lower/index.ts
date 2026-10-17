import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const nonSargableLowerRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-FLT-003',
    name: 'Non-SARGable String Function (LOWER)',
    category: 'Filtering',
    severity: 'High',
    estimatedImpact: 'High',
    fixPriority: 2,
    tags: ['Performance', 'Indexability', 'SARGable'],
  },
  evaluate(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match LOWER(column_name)
    const regex = /\bLOWER\s*\(\s*([a-zA-Z0-9_.]+)\s*\)/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];
      const column = match[1];

      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: `Detected LOWER() function wrapping the column '${column}'.`,
          whyMatters: 'Applying functions to columns in filtering conditions prevents the database from using standard B-tree indexes, forcing a full table scan.',
          recommendation: 'Use a case-insensitive collation or create a functional index on the column.',
          confidence: 'High',
          confidenceReason: 'Syntax-level anti-pattern that universally breaks standard SARGability.',
          safeRewrite: {
            from: `${fullMatch} = '[value]'`,
            to: `${column} ILIKE '[value]'`,
            rewriteConfidence: 'Review' // ILIKE is Postgres specific and still requires an index
          }
        }
      });
    }

    return results;
  }
};
