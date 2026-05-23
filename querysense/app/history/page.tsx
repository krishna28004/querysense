"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import DiffViewer from "@/components/editor/DiffViewer";

import { AnalysisResponse } from "@/lib/analyzer/types";

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/history");
        if (!response.ok) {
          throw new Error("Failed to load history records");
        }
        const data = await response.json();
        setHistory(data);
      } catch (err: any) {
        setError(err.message || "Could not retrieve query history.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getSeverityColor = (severity: string): "critical" | "warning" | "info" | "success" | "neutral" => {
    switch (severity) {
      case "critical":
        return "critical";
      case "warning":
        return "warning";
      case "good":
        return "success";
      default:
        return "info";
    }
  };

  return (
    <>
      <Sidebar />
      <main className="flex-1 ml-[var(--qs-sidebar-width)] flex flex-col min-h-screen">
        <Header />

        <div className="flex-1 qs-bg-grid qs-bg-radial">
          <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            {/* Header Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-[var(--qs-text-primary)]">
                Optimization History
              </h1>
              <p className="text-sm text-[var(--qs-text-secondary)] mt-1">
                Browse and inspect past SQL query performance analyses stored locally in SQLite.
              </p>
            </motion.div>

            {/* Error state */}
            {error && (
              <Card variant="default" className="border-rose-500/20 bg-rose-500/5 text-rose-400 p-4">
                <div className="text-sm font-bold font-mono">DATABASE ERROR</div>
                <p className="text-xs mt-1">{error}</p>
              </Card>
            )}

            {/* Main Content Area */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Spinner size="lg" />
                <span className="text-xs text-[var(--qs-text-muted)] font-mono">Connecting to SQLite History...</span>
              </div>
            ) : history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card variant="glass" padding="lg" className="text-center">
                  <div className="py-12 space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-[var(--qs-bg-elevated)] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--qs-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--qs-text-primary)]">
                      No analyses found
                    </h3>
                    <p className="text-sm text-[var(--qs-text-muted)] max-w-sm mx-auto">
                      Once you analyze your first SQL query on the analyzer dashboard, it will appear here for audit history.
                    </p>
                    <div className="pt-2">
                      <Button variant="primary" size="md" onClick={() => router.push("/")}>
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {history.map((record) => {
                  const isExpanded = expandedId === record.id;
                  const dateLabel = new Date(record.analyzed_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <Card
                      key={record.id}
                      variant="interactive"
                      padding="none"
                      className="overflow-hidden shadow-md"
                    >
                      {/* Summary Row */}
                      <div
                        className="p-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 cursor-pointer hover:bg-[var(--qs-bg-secondary)] transition-colors duration-200"
                        onClick={() => toggleExpand(record.id)}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Score Badge */}
                          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[var(--qs-bg-secondary)] border border-[var(--qs-border)] font-mono shrink-0">
                            <span className={`text-base font-bold ${
                              record.score >= 90 ? "text-emerald-500" : record.score >= 70 ? "text-sky-500" : record.score >= 40 ? "text-amber-500" : "text-rose-500"
                            }`}>
                              {record.score}
                            </span>
                            <span className="text-[8px] text-[var(--qs-text-muted)] uppercase tracking-wider font-sans -mt-0.5">
                              score
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={getSeverityColor(record.severity)} size="sm">
                                {record.severity}
                              </Badge>
                              <span className="text-[10px] text-[var(--qs-text-muted)] font-mono">{dateLabel}</span>
                              <span className="text-[10px] text-[var(--qs-text-muted)] font-mono">• {record.issues.length} Issues</span>
                            </div>
                            {/* Snippet of SQL query */}
                            <code className="block text-xs font-mono text-[var(--qs-text-secondary)] mt-1.5 truncate max-w-[400px] md:max-w-[550px] opacity-75">
                              {record.original_query.split("\n")[0]}
                            </code>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Direct preloading by setting query parameters or redirecting
                              // Let's copy it and direct them back to dashboard
                              navigator.clipboard.writeText(record.original_query);
                              router.push("/");
                            }}
                            icon={
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 2 22 22 22 12 2" />
                              </svg>
                            }
                          >
                            Use SQL
                          </Button>

                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-[var(--qs-text-muted)]"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </motion.div>
                        </div>
                      </div>

                      {/* Expandable diff comparison */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="border-t border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] overflow-hidden"
                          >
                            <div className="p-4 space-y-4">
                              {record.explanation && (
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
                                    Historical Explanation
                                  </h4>
                                  <p className="text-xs text-[var(--qs-text-secondary)] leading-relaxed">
                                    {record.explanation}
                                  </p>
                                </div>
                              )}

                              {/* Issues List snippet */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
                                  Detected Bottlenecks
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {record.issues.map((issue: any) => (
                                    <div key={issue.id} className="p-2 rounded-lg bg-[var(--qs-bg-card)] border border-[var(--qs-border)] text-xs space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-[var(--qs-text-primary)]">{issue.title}</span>
                                        <Badge variant={getSeverityColor(issue.severity)} size="sm">{issue.severity}</Badge>
                                      </div>
                                      <p className="text-[var(--qs-text-muted)] leading-normal">{issue.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
                                  Side-by-Side Comparison
                                </h4>
                                <DiffViewer oldValue={record.original_query} newValue={record.optimized_query || record.original_query} splitView={true} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
