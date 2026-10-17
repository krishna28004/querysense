import { Parser } from 'node-sql-parser';
import { QueryGraph, FilterCondition, ColumnReference } from '../core/types';

export class QueryGraphExtractor {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  public parseAndExtract(sql: string): { ast: any; queryGraph: QueryGraph | undefined } {
    let ast;
    try {
      // We explicitly set the database type to postgresql per requirements
      const parseResult = this.parser.astify(sql, { database: 'postgresql' });
      // node-sql-parser can return an array of ASTs if there are multiple statements
      ast = Array.isArray(parseResult) ? parseResult[0] : parseResult;
    } catch {
      // Parsing failed, return no AST
      return { ast: undefined, queryGraph: undefined };
    }

    // Try to extract the QueryGraph. If it fails, we still return the AST.
    try {
      const queryGraph = this.buildQueryGraph(ast);
      return { ast, queryGraph };
    } catch {
      return { ast, queryGraph: undefined };
    }
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildQueryGraph(ast: any): QueryGraph {
    const graph: QueryGraph = {
      tables: [],
      joins: [],
      filters: [],
      selectedColumns: [],
      aggregations: [],
      having: [],
      groupBy: [],
      orderBy: [],
      unresolvedColumns: [],
      subqueryCount: 0,
      cteCount: 0,
      unionCount: 0
    };

    if (ast) {
      this.extractComplexityMetrics(ast, graph);
    }

    if (ast && ast.type === 'select') {
      this.extractTablesAndJoins(ast.from, graph);
      this.extractSelect(ast.columns, graph);
      this.extractWhere(ast.where, graph);
      this.extractHaving(ast.having, graph);
      this.extractOrderBy(ast.orderby, graph);
      this.extractGroupBy(ast.groupby, graph);
    }

    return graph;
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractComplexityMetrics(ast: any, graph: QueryGraph) {
    if (ast.with && Array.isArray(ast.with)) {
      graph.cteCount += ast.with.length;
    }

    const visited = new Set<unknown>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverse = (node: any, isRoot: boolean = false) => {
      if (!node || typeof node !== 'object') return;
      if (visited.has(node)) return;
      visited.add(node);

      if (!isRoot && node.ast && typeof node.ast === 'object' && node.ast.type === 'select') {
        graph.subqueryCount++;
      }

      if (node.set_op && typeof node.set_op === 'string' && node.set_op.toLowerCase().includes('union')) {
        graph.unionCount++;
      }

      for (const key of Object.keys(node)) {
        if (Array.isArray(node[key])) {
          for (const item of node[key]) {
            traverse(item, false);
          }
        } else if (typeof node[key] === 'object') {
          traverse(node[key], false);
        }
      }
    };

    traverse(ast, true);
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractTablesAndJoins(fromNode: any, graph: QueryGraph) {
    if (!fromNode) return;

    let previousTableAlias = '';

    // node-sql-parser represents FROM as an array of expressions
    for (let i = 0; i < fromNode.length; i++) {
      const item = fromNode[i];

      // node-sql-parser PostgreSQL dialect bug:
      // "users CROSS JOIN admins" -> users AS CROSS, INNER JOIN admins
      let isBuggedCrossJoin = false;
      if (item.as && item.as.toUpperCase() === 'CROSS') {
         isBuggedCrossJoin = true;
      }

      if (item.table) {
        const alias = isBuggedCrossJoin ? null : (item.as || null);
        graph.tables.push({
          name: item.table,
          alias: alias
        });
        if (!item.join) {
           previousTableAlias = alias || item.table;
        }
      }

      // If it's a join, node-sql-parser marks it with `join` property
      if (item.join) {
        const leftTableAlias = previousTableAlias;
        const rightTableAlias = item.as || item.table || '';
        previousTableAlias = rightTableAlias;

        const conditions: FilterCondition[] = [];
        if (item.on) {
           conditions.push(this.parseCondition(item.on));
        }

        // Check if the previous item was the victim of the CROSS JOIN bug
        const prevItem = fromNode[i - 1];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        let joinType = item.join.toUpperCase().replace(' JOIN', '').trim() as any;
        if (prevItem && prevItem.as && prevItem.as.toUpperCase() === 'CROSS') {
            joinType = 'CROSS';
        }

        graph.joins.push({
          type: joinType,
          leftTableAlias,
          rightTableAlias,
          conditions
        });
      }
    }
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractSelect(columnsNode: any, graph: QueryGraph) {
    if (!columnsNode || columnsNode === '*') return; // handle 'SELECT *' separately or ignore here

    if (Array.isArray(columnsNode)) {
      for (const col of columnsNode) {
        if (col.expr && col.expr.type === 'column_ref') {
          graph.selectedColumns.push(this.parseColumnRef(col.expr));
        } else if (col.expr && col.expr.type === 'aggr_func') {
          graph.aggregations.push({
            function: col.expr.name.toUpperCase(),
            arguments: col.expr.args && col.expr.args.expr ? [this.parseColumnRef(col.expr.args.expr)] : [],
            isDistinct: !!(col.expr.args && col.expr.args.distinct)
          });
        }
      }
    }
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractWhere(whereNode: any, graph: QueryGraph) {
    if (!whereNode) return;

    if (whereNode.type === 'binary_expr') {
      // Just a simple heuristic for now. To do deep nesting we'd traverse the binary expression tree
      if (whereNode.operator === 'AND' || whereNode.operator === 'OR') {
         // recursively handle OR/AND chains
         this.extractWhere(whereNode.left, graph);
         this.extractWhere(whereNode.right, graph);
      } else {
         graph.filters.push(this.parseCondition(whereNode));
      }
    }
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractOrderBy(orderByNode: any, graph: QueryGraph) {
    if (!orderByNode) return;
    for (const item of orderByNode) {
      if (item.expr && item.expr.type === 'column_ref') {
         graph.orderBy.push({
           column: this.parseColumnRef(item.expr),
           direction: item.type === 'DESC' ? 'DESC' : 'ASC'
         });
      }
    }
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractGroupBy(groupByNode: any, graph: QueryGraph) {
    if (!groupByNode) return;
    const columns = Array.isArray(groupByNode) ? groupByNode : (groupByNode.columns || []);
    for (const item of columns) {
      if (item.type === 'column_ref') {
        graph.groupBy.push(this.parseColumnRef(item));
      }
    }
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractHaving(havingNode: any, graph: QueryGraph) {
    if (!havingNode) return;

    if (havingNode.type === 'binary_expr') {
      if (havingNode.operator === 'AND' || havingNode.operator === 'OR') {
         this.extractHaving(havingNode.left, graph);
         this.extractHaving(havingNode.right, graph);
      } else {
         graph.having.push(this.parseCondition(havingNode));
      }
    }
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseCondition(expr: any): FilterCondition {
    return {
      // 'expr' means non-column-ref (function, literal, subquery) — Index module must skip these
      left: expr.left && expr.left.type === 'column_ref' ? this.parseColumnRef(expr.left) : 'expr',
      operator: expr.operator,
      // 'expr' means non-column-ref (function, literal, subquery) — Index module must skip these
      right: expr.right && expr.right.type === 'column_ref' ? this.parseColumnRef(expr.right) : 'expr'
    };
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseColumnRef(expr: any): ColumnReference {
    let columnName = expr.column;
    // node-sql-parser may wrap the column name in an expression object
    if (typeof columnName === 'object' && columnName !== null && columnName.expr) {
       columnName = columnName.expr.value || columnName.expr.name;
    }
    // sometimes it's just value directly inside expr if type is column_ref
    if (typeof columnName !== 'string') {
        if (expr.type === 'column_ref' && expr.column) {
            columnName = typeof expr.column === 'string' ? expr.column : (expr.column.expr?.value || JSON.stringify(expr.column));
        } else {
            columnName = String(expr.column);
        }
    }

    return {
      tableAlias: expr.table || null,
      columnName: columnName
    };
  }
}
