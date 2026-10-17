import { QueryGraph, IndexOpportunity, ColumnReference } from '../core/types';

export function analyzeIndexes(graph: QueryGraph): { opportunities: IndexOpportunity[] } {
  const opportunities: IndexOpportunity[] = [];

  try {
    if (!graph) return { opportunities: [] };

    const tableFilters = new Map<string, { equality: string[], range: string[] }>();
    const tableNames = new Map<string, string | null>();
    const tableSorts = new Map<string, string[]>();

    const resolveAlias = (alias: string | null): { alias: string, name: string | null } => {
      if (alias) {
        for (const t of graph.tables || []) {
          if (t.alias === alias || t.name === alias) {
            return { alias: t.alias || t.name, name: t.name };
          }
        }
        return { alias, name: null };
      } else {
        if (graph.tables && graph.tables.length === 1) {
          return { alias: graph.tables[0].alias || graph.tables[0].name, name: graph.tables[0].name };
        }
        return { alias: 'unknown', name: null };
      }
    };

    const addFilterToTable = (colRef: ColumnReference | string, isEq: boolean, isRng: boolean) => {
      if (typeof colRef === 'string') return; // Skip 'expr' strings
      const { tableAlias, columnName } = colRef;
      const resolved = resolveAlias(tableAlias);

      if (!tableFilters.has(resolved.alias)) {
        tableFilters.set(resolved.alias, { equality: [], range: [] });
        tableNames.set(resolved.alias, resolved.name);
      }

      const tf = tableFilters.get(resolved.alias)!;
      if (isEq && !tf.equality.includes(columnName)) tf.equality.push(columnName);
      if (isRng && !tf.range.includes(columnName)) tf.range.push(columnName);
    };

    // 1. Process filters for Single and Composite opportunities
    for (const filter of graph.filters || []) {
      // The instruction mentioned skipping filters if 'expr' is present.
      // However, typical filters like 'id = 5' have 'expr' on the right side.
      // Skipping the whole filter would break all single-column index detection.
      // We explicitly skip the 'expr' SIDE and only process ColumnReferences.
      if (typeof filter.left === 'string' && typeof filter.right === 'string') {
          continue; // both are expressions, no columns to index
      }

      const op = (filter.operator || '').toUpperCase().trim();
      const isEq = op === '=' || op === 'IN';
      // Known limitation: LIKE with leading wildcard (%value) is non-sargable.
      // Full literal inspection requires right-side value extraction — deferred to Phase 2.
      const isRng = ['>', '<', '>=', '<=', 'BETWEEN', 'LIKE', 'ILIKE'].includes(op);

      if (typeof filter.left !== 'string') {
        addFilterToTable(filter.left, isEq, isRng);
      }
      if (typeof filter.right !== 'string') {
        addFilterToTable(filter.right, isEq, isRng);
      }
    }

    // Process ORDER BY columns
    for (const ob of graph.orderBy || []) {
      if (typeof ob.column === 'string') continue;
      const resolved = resolveAlias((ob.column as ColumnReference).tableAlias);
      if (!tableSorts.has(resolved.alias)) {
        tableSorts.set(resolved.alias, []);
        if (!tableNames.has(resolved.alias)) tableNames.set(resolved.alias, resolved.name);
      }
      const ts = tableSorts.get(resolved.alias)!;
      if (!ts.includes((ob.column as ColumnReference).columnName)) {
        ts.push((ob.column as ColumnReference).columnName);
      }
    }

    const deduplicatedPush = (opp: IndexOpportunity) => {
      const exists = opportunities.some(o =>
        o.tableAlias === opp.tableAlias &&
        o.opportunityType === opp.opportunityType &&
        o.columns.length === opp.columns.length &&
        o.columns.every(c => opp.columns.includes(c))
      );
      if (!exists) {
        opportunities.push(opp);
      }
    };

    // 2. Generate Single & Composite opportunities per table
    for (const [alias, tf] of tableFilters.entries()) {
      const tName = tableNames.get(alias) || null;
      const sorts = tableSorts.get(alias) || [];

      // Single opportunities
      for (const col of tf.equality) {
        deduplicatedPush({
          tableAlias: alias,
          tableName: tName,
          opportunityType: 'Single',
          columns: [col],
          reasoning: `Equality filter on ${col} is a strong candidate for an index.`,
          confidence: 'High'
        });
      }
      for (const col of tf.range) {
        deduplicatedPush({
          tableAlias: alias,
          tableName: tName,
          opportunityType: 'Single',
          columns: [col],
          reasoning: `Range filter on ${col} is a candidate for an index.`,
          confidence: 'Medium'
        });
      }

      // Composite opportunities (Equality -> Sort -> Range)
      if (tf.equality.length > 0 && tf.range.length > 0) {
        const compCols = [
          ...tf.equality,
          ...sorts.filter(s => !tf.equality.includes(s) && !tf.range.includes(s)),
          ...tf.range
        ];
        deduplicatedPush({
          tableAlias: alias,
          tableName: tName,
          opportunityType: 'Composite',
          columns: compCols,
          reasoning: `Composite index opportunity combining equality, sort, and range filters.`,
          confidence: 'High'
        });
      } else if (tf.equality.length > 0 && sorts.length > 0) {
        const compCols = [...tf.equality, ...sorts.filter(s => !tf.equality.includes(s))];
        if (compCols.length > 1) {
          deduplicatedPush({
            tableAlias: alias,
            tableName: tName,
            opportunityType: 'Composite',
            columns: compCols,
            reasoning: `Composite index opportunity combining equality and sort columns.`,
            confidence: 'High'
          });
        }
      } else if (tf.range.length > 1 && tf.equality.length === 0) {
        const compCols = [...sorts.filter(s => !tf.range.includes(s)), ...tf.range];
        if (compCols.length > 1) {
          deduplicatedPush({
            tableAlias: alias,
            tableName: tName,
            opportunityType: 'Composite',
            columns: compCols,
            reasoning: `Composite index opportunity for multiple range filters.`,
            confidence: 'Low'
          });
        }
      } else if (tf.equality.length > 1 && tf.range.length === 0 && sorts.length === 0) {
        deduplicatedPush({
          tableAlias: alias,
          tableName: tName,
          opportunityType: 'Composite',
          columns: [...tf.equality],
          reasoning: `Composite index opportunity combining multiple equality filters.`,
          confidence: 'High'
        });
      }
    }

    // 3. Process Join Opportunities
    for (const join of graph.joins || []) {
      for (const cond of join.conditions || []) {
        // Skip join conditions where either side is 'expr'
        if (typeof cond.left !== 'string' && typeof cond.right !== 'string') {
          const leftRes = resolveAlias(cond.left.tableAlias);
          const rightRes = resolveAlias(cond.right.tableAlias);

          deduplicatedPush({
            tableAlias: leftRes.alias,
            tableName: leftRes.name,
            opportunityType: 'Join',
            columns: [cond.left.columnName],
            reasoning: `Join condition on ${cond.left.columnName} is a strong candidate for an index.`,
            confidence: 'High'
          });

          deduplicatedPush({
            tableAlias: rightRes.alias,
            tableName: rightRes.name,
            opportunityType: 'Join',
            columns: [cond.right.columnName],
            reasoning: `Join condition on ${cond.right.columnName} is a strong candidate for an index.`,
            confidence: 'High'
          });
        }
      }
    }

    return { opportunities };
  } catch {
    return { opportunities: [] };
  }
}
