import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const selectStarRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-IDX-001',
    name: 'Select All Columns (SELECT *)',
    category: 'Indexability', // Prevents covering indexes
    severity: 'Low',
    estimatedImpact: 'Medium',
    fixPriority: 4,
    tags: ['Performance', 'Network', 'Memory'],
  },
  evaluate(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match SELECT * or SELECT t.*
    // Negative lookbehind for COUNT( or other functions is hard in JS, so we'll match:
    // SELECT followed by optional spaces, optional alias., and *
    const regex = /\bSELECT\s+(?:[a-zA-Z0-9_]+\.)?\*/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];

      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: `Detected '${fullMatch}' without explicit column names.`,
          whyMatters: 'Fetching all columns increases network payload, increases database memory consumption, and prevents the query optimizer from utilizing covering indexes.',
          recommendation: 'Explicitly specify only the required columns in the SELECT list.',
          confidence: 'High',
          confidenceReason: 'Syntax explicitly requests all columns.',
          // No safe rewrite possible as we don't know the required columns
        }
      });
    }

    return results;
  }
};
