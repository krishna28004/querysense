import { RuleResult } from '../core/types';

export const CATEGORY_WEIGHTS = {
  "Joins": 0.30,
  "Filtering": 0.25,
  "Indexability": 0.20,
  "Aggregation": 0.15,
  "Sorting": 0.10
};

export const SEVERITY_DEDUCTIONS = {
  "Critical": 0.60,
  "High": 0.30,
  "Medium": 0.15,
  "Low": 0.05
};

export interface ScoreReport {
  overallScore: number;
  categories: {
    [key in keyof typeof CATEGORY_WEIGHTS]: number;
  };
}

export function calculateOptimizationScore(results: RuleResult[]): ScoreReport {
  const categoryScores = {
    "Joins": 100,
    "Filtering": 100,
    "Indexability": 100,
    "Aggregation": 100,
    "Sorting": 100
  };

  // Apply deductions asymptotically per category
  for (const result of results) {
    const category = result.evidence.metadata.category;
    const severity = result.evidence.metadata.severity;

    const deduction = SEVERITY_DEDUCTIONS[severity];
    categoryScores[category] = categoryScores[category] * (1 - deduction);
  }

  // Calculate overall score based on weighted average
  let overallScore = 0;


  for (const [cat, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const categoryName = cat as keyof typeof CATEGORY_WEIGHTS;
    overallScore += categoryScores[categoryName] * weight;

  }

  return {
    overallScore: Math.round(overallScore),
    categories: {
      "Joins": Math.round(categoryScores["Joins"]),
      "Filtering": Math.round(categoryScores["Filtering"]),
      "Indexability": Math.round(categoryScores["Indexability"]),
      "Aggregation": Math.round(categoryScores["Aggregation"]),
      "Sorting": Math.round(categoryScores["Sorting"])
    }
  };
}
