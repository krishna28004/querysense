import { QueryGraph, ComplexityDimensions, UnifiedRisk, ComplexityLevel } from '../core/types';

export interface StructureAnalysisResult {
  dimensions: ComplexityDimensions;
  metrics: {
    subqueryCount: number;
    cteCount: number;
    unionCount: number;
    joinCount: number;
    aggregationCount: number;
    orderByCount: number;
  };
  risks: UnifiedRisk[];
}

export function analyzeStructure(graph: QueryGraph): StructureAnalysisResult {
  const defaultResult: StructureAnalysisResult = {
    dimensions: {
      join: 'LOW',
      aggregation: 'LOW',
      nesting: 'LOW',
      sorting: 'LOW'
    },
    metrics: {
      subqueryCount: 0,
      cteCount: 0,
      unionCount: 0,
      joinCount: 0,
      aggregationCount: 0,
      orderByCount: 0
    },
    risks: []
  };

  try {
    if (!graph) return defaultResult;

    const metrics = {
      subqueryCount: graph.subqueryCount || 0,
      cteCount: graph.cteCount || 0,
      unionCount: graph.unionCount || 0,
      joinCount: (graph.joins || []).length,
      aggregationCount: (graph.aggregations || []).length,
      orderByCount: (graph.orderBy || []).length
    };

    const risks: UnifiedRisk[] = [];

    // --- Join Complexity ---
    let joinLevel: ComplexityLevel = 'LOW';
    if (metrics.joinCount > 3) {
      joinLevel = 'HIGH';
    } else if (metrics.joinCount > 0) {
      joinLevel = 'MEDIUM';
    }

    if (graph.joins) {
      for (const join of graph.joins) {
        if (join.type === 'CROSS') {
          risks.push({
            source: 'Join',
            severity: 'Critical',
            title: 'Explicit Cartesian Product (CROSS JOIN)',
            description: `A CROSS JOIN between ${join.leftTableAlias} and ${join.rightTableAlias} creates a Cartesian product, expanding rows geometrically.`
          });
        }
      }
    }

    if (metrics.joinCount > 2 && (!graph.filters || graph.filters.length === 0)) {
      risks.push({
        source: 'Join',
        severity: 'High',
        title: 'Unfiltered Multi-Join (Fan-Out Risk)',
        description: `Query joins ${metrics.joinCount + 1} tables without any WHERE filters, severely risking an implicit Cartesian explosion.`
      });
    }

    // --- Aggregation Complexity ---
    let aggLevel: ComplexityLevel = 'LOW';
    if (metrics.aggregationCount > 2) {
      aggLevel = 'HIGH';
    } else if (metrics.aggregationCount > 0) {
      aggLevel = 'MEDIUM';
    }

    // Bump aggregation complexity if COUNT(DISTINCT) is present
    if (graph.aggregations) {
      const hasDistinct = graph.aggregations.some(agg => agg.isDistinct);
      if (hasDistinct) {
        if (aggLevel === 'LOW') aggLevel = 'MEDIUM';
        else if (aggLevel === 'MEDIUM') aggLevel = 'HIGH';
      }
    }

    // --- Nesting Complexity ---
    let nestingLevel: ComplexityLevel = 'LOW';
    const totalNesting = metrics.subqueryCount + metrics.cteCount;
    if (totalNesting > 2) {
      nestingLevel = 'HIGH';
    } else if (totalNesting > 0) {
      nestingLevel = 'MEDIUM';
    }

    // --- Sorting Complexity ---
    let sortingLevel: ComplexityLevel = 'LOW';
    if (metrics.orderByCount > 2) {
      sortingLevel = 'HIGH';
    } else if (metrics.orderByCount > 0) {
      sortingLevel = 'MEDIUM';
    }

    return {
      dimensions: {
        join: joinLevel,
        aggregation: aggLevel,
        nesting: nestingLevel,
        sorting: sortingLevel
      },
      metrics,
      risks
    };
  } catch {
    return defaultResult;
  }
}
