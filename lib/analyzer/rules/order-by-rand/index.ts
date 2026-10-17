import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const orderByRandRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-SRT-003',
    name: 'Random Sorting (ORDER BY RAND)',
    category: 'Sorting',
    severity: 'High',
    estimatedImpact: 'High',
    fixPriority: 2,
    tags: ['Performance', 'Sorting', 'Randomization'],
  },
  evaluate(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match ORDER BY RAND(), RANDOM(), NEWID()
    const regex = /\bORDER\s+BY\s+(?:RAND|RANDOM|NEWID)\s*\(\s*\)/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];

      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: `Detected '${fullMatch}'.`,
          whyMatters: 'Sorting by a random function forces the database engine to perform a full table scan, calculate a random value for every single row, and then sort the entire massive unindexed dataset just to return a few random rows.',
          recommendation: 'To fetch random rows efficiently, pick random IDs in the application layer or use a TABLESAMPLE clause if supported.',
          confidence: 'High',
          confidenceReason: 'Syntax explicitly requests a random sort.',
          // No safe rewrite without application layer changes
        }
      });
    }

    return results;
  }
};
