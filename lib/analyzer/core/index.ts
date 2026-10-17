import { AnalysisContext, RuleResult, AnalysisReportV3, UnifiedRisk, UnifiedOpportunity, Severity } from './types';
import { ruleRegistry } from './registry';
import { normalizeSql, stripCommentsOnly } from '../utils/sql-normalizer';
import { calculateOptimizationScore, ScoreReport } from '../scoring';

import { QueryGraphExtractor } from '../ast/extractor';
import { analyzeStructure, StructureAnalysisResult } from '../structure';
import { analyzeIndexes } from '../indexes';

export interface LegacyAnalyzerReport {
  score: ScoreReport;
  findings: RuleResult[];
}

export class QueryAnalyzer {
  private extractor = new QueryGraphExtractor();

  public analyze(rawQuery: string): AnalysisReportV3 {
    try {
      const normalizedQuery = normalizeSql(rawQuery);
      const queryWithoutComments = stripCommentsOnly(rawQuery);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
      let ast: any = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      let queryGraph: any = undefined;

      // Extract AST and QueryGraph gracefully
      try {
        const extracted = this.extractor.parseAndExtract(rawQuery);
        ast = extracted.ast;
        queryGraph = extracted.queryGraph;
        if (!ast) {
          throw new Error("Syntax error: Failed to parse AST");
        }
      } catch (_e) {
        throw _e; // Fail fast so we hit the ultimate catch block
      }

      const context: AnalysisContext = {
        rawQuery,
        normalizedQuery,
        queryWithoutComments,
        ast,
        queryGraph
      };

      // --- Anti-Pattern Engine ---
      const findings: RuleResult[] = [];

      for (const rule of ruleRegistry) {
        let results: RuleResult[] = [];

        if (ast && rule.evaluateAst) {
          // Safe to use AST
          try {
            results = rule.evaluateAst(context);
          } catch {
            // Fallback to regex if evaluateAst fails
            if (rule.evaluateRegex) results = rule.evaluateRegex(context);
            else if (rule.evaluate) results = rule.evaluate(context);
          }
        } else {
          // Fallback to regex
          if (rule.evaluateRegex) results = rule.evaluateRegex(context);
          else if (rule.evaluate) results = rule.evaluate(context);
        }

        findings.push(...results);
      }

      // Sort findings by Category, then FixPriority, then Severity (Critical -> Low)
      const categoryRank: Record<string, number> = {
        "Filtering": 1,
        "Indexability": 2,
        "Joins": 3,
        "Sorting": 4,
        "Aggregation": 5
      };
      const severityRank: Record<string, number> = { "Critical": 1, "High": 2, "Medium": 3, "Low": 4 };

      findings.sort((a, b) => {
        const catA = a.evidence.metadata.category;
        const catB = b.evidence.metadata.category;

        if (catA !== catB) {
          return (categoryRank[catA] || 99) - (categoryRank[catB] || 99);
        }
        if (a.evidence.metadata.fixPriority !== b.evidence.metadata.fixPriority) {
          return a.evidence.metadata.fixPriority - b.evidence.metadata.fixPriority;
        }
        return severityRank[a.evidence.metadata.severity] - severityRank[b.evidence.metadata.severity];
      });

      // Calculate severity counts
      const severityCounts: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      for (const f of findings) {
        const sev = f.evidence.metadata.severity as Severity;
        if (severityCounts[sev] !== undefined) severityCounts[sev]++;
      }

      // --- Structural Intelligence Module ---
      let structureResult: StructureAnalysisResult = {
        dimensions: { join: 'LOW', aggregation: 'LOW', nesting: 'LOW', sorting: 'LOW' },
        metrics: { subqueryCount: 0, cteCount: 0, unionCount: 0, joinCount: 0, aggregationCount: 0, orderByCount: 0 },
        risks: []
      };

      if (queryGraph) {
        try {
          structureResult = analyzeStructure(queryGraph);
        } catch {
          // Log and use empty defaults
        }
      }

      // --- Index Opportunity Module ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      let indexResult = { opportunities: [] as any[] };
      if (queryGraph) {
        try {
          indexResult = analyzeIndexes(queryGraph);
        } catch {
          // Log and use empty defaults
        }
      }

      const scoreReport = calculateOptimizationScore(findings);

      // --- Executive Summary Builder ---
      const healthRisks: UnifiedRisk[] = findings.map(f => ({
        source: 'Health',
        severity: f.evidence.metadata.severity as Severity,
        title: f.evidence.metadata.name,
        description: f.evidence.whyMatters
      }));

      // Combine health risks and structural risks with caps to prevent one source burying the other
      // Take max 2 health risks (highest severity)
      const sortedHealthRisks = [...healthRisks].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
      const cappedHealthRisks = sortedHealthRisks.slice(0, 2);
      // Take max 2 structural risks (highest severity)
      const sortedStructuralRisks = [...structureResult.risks].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
      const cappedStructuralRisks = sortedStructuralRisks.slice(0, 2);
      // Merge, sort by severity, take top 3
      const allRisks = [...cappedHealthRisks, ...cappedStructuralRisks];
      allRisks.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
      const topRisks = allRisks.slice(0, 3);

      const confidenceRank: Record<string, number> = { "High": 1, "Medium": 2, "Low": 3 };
      const sortedOpportunities = [...indexResult.opportunities].sort((a, b) => confidenceRank[a.confidence] - confidenceRank[b.confidence]);

      const topOpportunities: UnifiedOpportunity[] = sortedOpportunities.slice(0, 3).map(o => ({
        source: 'Index',
        type: 'Index',
        title: `Index Opportunity on ${o.tableAlias || o.tableName} (${o.columns.join(', ')})`,
        description: o.reasoning,
        impact: o.confidence === 'High' ? 'High' : (o.confidence === 'Medium' ? 'Medium' : 'Low')
      }));

      return {
        summary: {
          optimizationScore: scoreReport.overallScore,
          topRisks,
          topOpportunities
        },
        health: {
          findings,
          severityCounts
        },
        joins: {
          metrics: {
            tableCount: queryGraph?.tables?.length || 0,
            joinCount: queryGraph?.joins?.length || 0,
            joinDepth: queryGraph?.joins?.length || 0
          },
          risks: structureResult.risks.filter(r => r.source === 'Join')
        },
        indexes: {
          opportunities: indexResult.opportunities
        },
        structure: {
          dimensions: structureResult.dimensions,
          metrics: structureResult.metrics
        }
      };

    } catch {
      // Ultimate degradation fallback if something catastrophic happens
      return {
        summary: { optimizationScore: 0, topRisks: [], topOpportunities: [] },
        health: { findings: [], severityCounts: { Critical: 0, High: 0, Medium: 0, Low: 0 } },
        joins: { metrics: { tableCount: 0, joinCount: 0, joinDepth: 0 }, risks: [] },
        indexes: { opportunities: [] },
        structure: {
          dimensions: { join: 'LOW', aggregation: 'LOW', nesting: 'LOW', sorting: 'LOW' },
          metrics: { subqueryCount: 0, cteCount: 0, unionCount: 0, joinCount: 0, aggregationCount: 0, orderByCount: 0 }
        },
        _parseFailure: true
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    }
  }
}
