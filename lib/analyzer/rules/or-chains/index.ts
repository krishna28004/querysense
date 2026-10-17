import { AnalyzerRule, AnalysisContext, RuleResult } from '../../core/types';

export const orChainsRule: AnalyzerRule = {
  metadata: {
    ruleCode: 'QS-FLT-006',
    name: 'Long OR Chains',
    category: 'Filtering',
    severity: 'Medium',
    estimatedImpact: 'Medium',
    fixPriority: 3,
    tags: ['Performance', 'Filtering', 'Query-Optimizer'],
  },
  evaluateAst(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];
    if (!context.ast || !context.ast.where) return results;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findOrChains = (node: any) => {
      if (!node) return;

      if (node.type === 'binary_expr' && node.operator === 'OR') {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orConditions: any[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flattenOrs = (n: any) => {
          if (n.type === 'binary_expr' && n.operator === 'OR') {
            flattenOrs(n.left);
            flattenOrs(n.right);
          } else {
            orConditions.push(n);
          }
        };

        flattenOrs(node);

        // Analyze the flat OR conditions
        const columnCounts = new Map<string, number>();
        for (const cond of orConditions) {
          if (cond.type === 'binary_expr' && cond.operator === '=') {
            if (cond.left && cond.left.type === 'column_ref') {
              let colName = '';
              if (typeof cond.left.column === 'string') {
                colName = cond.left.column;
              } else if (cond.left.column && cond.left.column.expr) {
                colName = cond.left.column.expr.value || cond.left.column.expr.column || '';
              }
              if (colName) {
                columnCounts.set(colName, (columnCounts.get(colName) || 0) + 1);
              }
            }
          }
        }

        for (const [col, count] of columnCounts.entries()) {
          if (count >= 3) {
            // Found an OR chain!
            // To provide a matchedSegment, we fallback to Regex for the matchedSegment since it's hard to rebuild exactly
            const regex = new RegExp(`\\b${col}\\s*=\\s*[^\\s]+(?:\\s+\\bOR\\b\\s+${col}\\s*=\\s*[^\\s]+){2,}`, 'i');
            const match = regex.exec(context.queryWithoutComments);

            if (match) {
              results.push({
                matchedSegment: match[0].trim(),
                evidence: {
                  metadata: this.metadata,
                  matchedSegment: match[0].trim(),
                  whyDetected: `Detected a long OR chain on the column '${col}'.`,
                  whyMatters: 'Long OR chains can confuse query optimizers, sometimes causing them to abandon indexes for full table scans due to poorly estimated selectivity.',
                  recommendation: 'Convert to an IN (...) list or use a derived table / UNION ALL if the values require complex resolution.',
                  confidence: 'High',
                  confidenceReason: 'AST confirms multiple OR conditions target the same column.',
                  safeRewrite: {
                    from: match[0].trim(),
                    to: `${col} IN (...)`,
                    rewriteConfidence: 'Review'
                  }
                }
              });
            }
          }
        }

        // We shouldn't traverse inside this OR tree again since we flattened it,
        // but technically there could be ANDs inside the ORs (e.g. `a OR b OR (c AND d)`).
        // Since we already parsed this OR tree, we can just return.
        return;
      }

      if (node.type === 'binary_expr') {
        findOrChains(node.left);
        findOrChains(node.right);
      }
    };

    findOrChains(context.ast.where);

    return results;
  },

  evaluateRegex(context: AnalysisContext): RuleResult[] {
    const results: RuleResult[] = [];

    // Detect column = X OR column = Y OR column = Z
    // Match the column name, then look for at least 2 subsequent 'OR column ='
    const regex = /\b([a-zA-Z0-9_.]+)\s*=\s*.*?(?:\bOR\b\s+\1\s*=\s*.*?){2,}/gi;
    let match;

    while ((match = regex.exec(context.normalizedQuery)) !== null) {
      const fullMatch = match[0];
      const column = match[1];

      results.push({
        matchedSegment: fullMatch.trim(),
        evidence: {
          metadata: this.metadata,
          matchedSegment: fullMatch.trim(),
          whyDetected: `Detected a long OR chain on the column '${column}'.`,
          whyMatters: 'Long OR chains can confuse query optimizers, sometimes causing them to abandon indexes for full table scans due to poorly estimated selectivity.',
          recommendation: 'Convert to an IN (...) list or use a derived table / UNION ALL if the values require complex resolution.',
          confidence: 'Medium',
          confidenceReason: 'Regex matched repeating column names with OR operators. Actual execution plan impact depends on database dialect.',
          safeRewrite: {
            from: fullMatch.trim(),
            to: `${column} IN (...)`,
            rewriteConfidence: 'Review' // Parsing out the exact values from a regex is brittle, so leave as a manual review
          }
        }
      });
    }

    return results;
  }
};
