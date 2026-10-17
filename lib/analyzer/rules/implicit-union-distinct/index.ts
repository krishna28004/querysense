import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const implicitUnionDistinctRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-SRT-002',
    name: 'Implicit Distinct Sort (UNION)',
    category: 'Sorting',
    severity: 'High',
    estimatedImpact: 'High',
    fixPriority: 2,
    tags: ['Performance', 'Sorting', 'Sets'],
  },
  evaluate(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match UNION not followed by ALL
    const regex = /\bUNION\b(?!\s+ALL\b)/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];

      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: 'Detected UNION without the ALL keyword.',
          whyMatters: 'UNION implicitly performs a global distinct sort operation to remove duplicates across the datasets. This is highly expensive compared to simply appending the sets.',
          recommendation: 'Use UNION ALL unless duplicate row removal is strictly required by the business logic.',
          confidence: 'High',
          confidenceReason: 'Syntax explicitly dictates a distinct operation.',
          safeRewrite: {
            from: 'UNION',
            to: 'UNION ALL',
            rewriteConfidence: 'Review' // Semantic change (duplicates will remain)
          }
        }
      });
    }

    return results;
  }
};
