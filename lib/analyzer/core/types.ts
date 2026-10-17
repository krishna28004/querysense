export interface AnalyzerRuleMetadata {
  ruleCode: string;
  name: string;
  category: "Filtering" | "Indexability" | "Joins" | "Sorting" | "Aggregation";
  severity: "Critical" | "High" | "Medium" | "Low";
  estimatedImpact: "High" | "Medium" | "Low";
  fixPriority: 1 | 2 | 3 | 4;
  tags: string[];
  documentationUrl?: string;
}

export interface DetectionEvidence {
  metadata: AnalyzerRuleMetadata;
  matchedSegment: string;
  whyDetected: string;
  whyMatters: string;
  recommendation: string;
  confidence: "High" | "Medium" | "Low";
  confidenceReason: string;
  safeRewrite?: {
    from: string;
    to: string;
    rewriteConfidence: "Safe" | "Review";
  };
}

export interface ColumnReference {
  tableAlias: string | null;
  columnName: string;
}

export interface FilterCondition {
  left: ColumnReference | string; // column or function/literal
  operator: string;               // =, >, <, LIKE, IN
  right: ColumnReference | string;
  logicalLink?: 'AND' | 'OR';
}

export interface QueryGraph {
  tables: Array<{
    name: string;
    alias: string | null;
  }>;
  joins: Array<{
    type: 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS' | 'FULL';
    leftTableAlias: string;
    rightTableAlias: string;
    conditions: FilterCondition[];
  }>;
  filters: FilterCondition[]; // WHERE clauses
  selectedColumns: ColumnReference[]; // SELECT clause
  aggregations: Array<{
    function: string; // e.g., COUNT, SUM
    arguments: ColumnReference[];
    isDistinct: boolean;
  }>;
  having: FilterCondition[]; // HAVING clauses
  groupBy: ColumnReference[];
  orderBy: Array<{
    column: ColumnReference;
    direction: 'ASC' | 'DESC';
  }>;
  unresolvedColumns: string[]; // Columns used without a table alias
  subqueryCount: number;
  cteCount: number;
  unionCount: number;
}

export interface AnalysisContext {
  rawQuery: string;
  normalizedQuery: string;
  queryWithoutComments: string;
  ast?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  queryGraph?: QueryGraph; // The flattened logical plan
}

export interface RuleResult {
  matchedSegment: string;
  evidence: DetectionEvidence;
  safeRewrite?: {
    from: string;
    to: string;
    rewriteConfidence: "Safe" | "Review";
  };
}

export interface AnalyzerRule {
  metadata: AnalyzerRuleMetadata;
  // Legacy evaluate method (to be deprecated)
  evaluate?(context: AnalysisContext): RuleResult[];
  // New hybrid methods
  evaluateRegex?(context: AnalysisContext): RuleResult[];
  evaluateAst?(context: AnalysisContext): RuleResult[];
}

// ---------------------------------------------------------
// V3 Unified Intelligence Interfaces
// ---------------------------------------------------------

export type Severity = "Critical" | "High" | "Medium" | "Low";

export interface UnifiedRisk {
  source: 'Health' | 'Execution' | 'Join' | 'Structure';
  severity: Severity;
  title: string;
  description: string;
}

export interface UnifiedOpportunity {
  source: 'Health' | 'Index' | 'Execution';
  type: 'Rewrite' | 'Index' | 'Configuration';
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface IndexOpportunity {
  tableAlias: string;
  tableName: string | null;
  opportunityType: 'Single' | 'Composite' | 'Join';
  columns: string[]; // Ordered e.g. ['status', 'created_at', 'age']
  reasoning: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export type ComplexityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ComplexityDimensions {
  join: ComplexityLevel;
  aggregation: ComplexityLevel;
  nesting: ComplexityLevel;
  sorting: ComplexityLevel;
}

export interface AnalysisReportV3 {
  // 1. Executive Summary
  summary: {
    optimizationScore: number;
    topRisks: UnifiedRisk[];
    topOpportunities: UnifiedOpportunity[];
  };

  // 2. Query Health (Anti-Pattern Engine)
  health: {
    findings: RuleResult[];
    severityCounts: Record<Severity, number>;
  };

  // 3. Join Intelligence (Join Analysis Engine / Structure Module)
  joins: {
    metrics: { tableCount: number; joinCount: number; joinDepth: number };
    risks: UnifiedRisk[];
  };

  // 4. Index Intelligence (Index Opportunity Engine)
  indexes: {
    opportunities: IndexOpportunity[];
  };

  // 5. Structural Intelligence (Complexity Engine)
  structure: {
    dimensions: ComplexityDimensions;
    metrics: {
      subqueryCount: number;
      cteCount: number;
      unionCount: number;
      joinCount: number;
      aggregationCount: number;
      orderByCount: number;
    };
  };
}
