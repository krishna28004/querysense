import type { Finding } from "./diagnostics";

export type SavedAnalysis = {
  id: string;
  title: string;
  sql: string;
  candidateSql?: string;
  plan?: string;
  candidatePlan?: string;
  savedAt: string;
  findingCount: number;
  findings: Finding[];
};

const KEY = "querysense.saved.v1";

export function loadHistory(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedAnalysis => item && typeof item.id === "string" && typeof item.sql === "string" && typeof item.savedAt === "string").slice(0, 25);
  } catch { return []; }
}

export function saveAnalysis(item: SavedAnalysis): void {
  const entries = loadHistory().filter(entry => entry.id !== item.id);
  localStorage.setItem(KEY, JSON.stringify([item, ...entries].slice(0, 25)));
}

export function deleteAnalysis(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(loadHistory().filter(entry => entry.id !== id)));
}
