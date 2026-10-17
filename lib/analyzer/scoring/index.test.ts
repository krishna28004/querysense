import { describe, it, expect } from 'vitest';
import { calculateOptimizationScore } from './index';
import { RuleResult, AnalyzerRuleMetadata } from '../core/types';

function mockFinding(category: AnalyzerRuleMetadata["category"], severity: AnalyzerRuleMetadata["severity"]): RuleResult {
  return {
    matchedSegment: '',
    evidence: {
      metadata: {
        ruleCode: 'MOCK',
        name: 'Mock',
        category,
        severity,
        estimatedImpact: 'Medium',
        fixPriority: 2,
        tags: []
      },
      whyDetected: '',
      whyMatters: '',
      recommendation: '',
      confidence: 'High',
      confidenceReason: ''
    }
  };
}

describe('calculateOptimizationScore', () => {
  it('returns 100 for no findings', () => {
    const report = calculateOptimizationScore([]);
    expect(report.overallScore).toBe(100);
    expect(report.categories.Filtering).toBe(100);
    expect(report.categories.Joins).toBe(100);
  });

  it('calculates deductions correctly for a single Critical finding', () => {
    // 1 Critical Join -> Joins = 100 * (1 - 0.6) = 40
    // Overall = (40 * 0.3) + (100 * 0.7) = 12 + 70 = 82
    const report = calculateOptimizationScore([
      mockFinding('Joins', 'Critical')
    ]);
    expect(report.categories.Joins).toBe(40);
    expect(report.overallScore).toBe(82);
  });

  it('calculates asymptotic deductions correctly for multiple findings in same category', () => {
    // 1 High Filtering -> 100 * (1 - 0.3) = 70
    // 1 Medium Filtering -> 70 * (1 - 0.15) = 59.5
    const report = calculateOptimizationScore([
      mockFinding('Filtering', 'High'),
      mockFinding('Filtering', 'Medium')
    ]);
    expect(report.categories.Filtering).toBe(60); // Math.round(59.5) = 60
  });

  it('never goes below 0 for a category', () => {
    const report = calculateOptimizationScore([
      mockFinding('Filtering', 'Critical'),
      mockFinding('Filtering', 'Critical'),
      mockFinding('Filtering', 'Critical'),
      mockFinding('Filtering', 'Critical'),
      mockFinding('Filtering', 'Critical')
    ]);
    // 100 * 0.4^5 = 100 * 0.01024 = 1.024
    // Never reaches negative
    expect(report.categories.Filtering).toBe(1);
  });
});
