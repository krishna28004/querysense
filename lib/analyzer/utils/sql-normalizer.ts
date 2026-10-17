export function normalizeSql(sql: string): string {
  // Matches:
  // 1. --... (single line comment)
  // 2. /* ... */ (multi-line comment)
  // 3. '...' (string literal, handling '' as escaped quote)
  const regex = /--.*$|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'/gm;

  return sql.replace(regex, (match) => {
    if (match.startsWith("'")) {
      return "''";
    }
    return "";
  });
}

export function stripCommentsOnly(sql: string): string {
  const regex = /--.*$|\/\*[\s\S]*?\*\//gm;
  return sql.replace(regex, "");
}
