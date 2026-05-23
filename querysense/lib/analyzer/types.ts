export type Severity = "critical" | "warning" | "info" | "good";
export type IssueSeverity = "critical" | "warning" | "info";

export interface Issue {
  id: string;
  category: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  suggestion: string;
  confidence: number; // 0 to 1
  source: "rule" | "ai";
  line?: number;
}

export interface PerformanceMetrics {
  estimated_rows_scanned: {
    before: number;
    after: number;
  };
  estimated_time_ms: {
    before: number;
    after: number;
  };
  complexity_score: {
    before: number;
    after: number;
  };
}

export interface AnalysisResponse {
  id: string;
  score: number;
  severity: Severity;
  original_query: string;
  optimized_query: string;
  issues: Issue[];
  metrics: PerformanceMetrics;
  explanation: string;
  metadata?: {
    confidence: number;
    reasoning_source: string;
    execution_timestamp: string;
    detected_by: "Rule Engine" | "AI" | "Hybrid";
    why_this_suggestion: string;
  };
  ai_disclaimer?: string;
  analyzed_at: string;
}

export interface AnalysisRequest {
  sql: string;
  schema?: string;
  dialect?: "postgresql";
}
