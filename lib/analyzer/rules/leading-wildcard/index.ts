import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const leadingWildcardRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-FLT-004',
    name: 'Leading Wildcard (LIKE %value)',
    category: 'Filtering',
    severity: 'High',
    estimatedImpact: 'High',
    fixPriority: 2,
    tags: ['Performance', 'Indexability', 'Full-Table-Scan'],
  },
  evaluate(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Match LIKE or ILIKE followed by '%...'
    // We use queryWithoutComments to avoid matching inside comments,
    // but we can't use normalizedQuery because the string content is stripped.
    const regex = /\b(I?LIKE)\s+'%[^']*'/gi;
    let match;

    while ((match = regex.exec(context.queryWithoutComments)) !== null) {
      const fullMatch = match[0];

      results.push({
        matchedSegment: fullMatch,
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch,
          whyDetected: `Detected a leading wildcard in a LIKE/ILIKE clause.`,
          whyMatters: 'Wildcards at the beginning of a string prevent the database from traversing the B-tree index, resulting in a full table scan.',
          recommendation: 'Use full-text search (e.g., tsvector in Postgres) or a trigram (pg_trgm) index for suffix matching.',
          confidence: 'High',
          confidenceReason: 'Syntax-level anti-pattern that universally breaks B-tree index usage.',
          // No safe rewrite possible without schema changes
        }
      });
    }

    return results;
  }
};
