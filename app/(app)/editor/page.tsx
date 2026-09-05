"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ShareButton from "@/components/ui/ShareButton";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

// Intelligence UI components
import SQLEditor from "@/components/editor/SQLEditor";
import DiffViewer from "@/components/editor/DiffViewer";
import ScoreGauge from "@/components/analysis/ScoreGauge";
import IssuesList from "@/components/analysis/IssuesList";
import QueryHealthSummary from "@/components/analysis/QueryHealthSummary";
import ExecutionTimeline from "@/components/analysis/ExecutionTimeline";
import SQLMorph from "@/components/analysis/SQLMorph";
import SuccessCelebration from "@/components/analysis/SuccessCelebration";
import QueryVision from "@/components/analysis/QueryVision";

import { SAMPLE_QUERIES, SampleQuery } from "@/lib/samples";
import { AnalysisResponse } from "@/lib/analyzer/types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

function EditorPageContent() {
  const searchParams = useSearchParams();
  const [sql, setSql] = useState("");
  const [schema, setSchema] = useState("");
  const [showSchemaInput, setShowSchemaInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [timelineStep, setTimelineStep] = useState(0);

  // Handle ?sample= URL parameter
  useEffect(() => {
    const sampleId = searchParams.get("sample");
    if (sampleId) {
      const sample = SAMPLE_QUERIES.find((s) => s.id === sampleId);
      if (sample) {
        const t = setTimeout(() => {
          setSql(sample.sql);
          if (sample.schema) {
            setSchema(sample.schema);
            setShowSchemaInput(true);
          }
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [searchParams]);

  // Load sample query into editor
  const handleSampleClick = (sample: SampleQuery) => {
    setSql(sample.sql);
    if (sample.schema) {
      setSchema(sample.schema);
      setShowSchemaInput(true);
    } else {
      setSchema("");
    }
    setError(null);
  };

  const handleAnalyze = useCallback(async () => {
    if (!sql.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql,
          schema: schema.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to optimize query. Please try again.");
      }

      const data = (await response.json()) as AnalysisResponse;
      setAnalysisResult(data);
      setTimelineStep(5);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected connection error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [sql, schema]);

  // Keyboard shortcut Ctrl+Enter to trigger analysis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (sql.trim() && !isAnalyzing) {
          handleAnalyze();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sql, isAnalyzing, schema, handleAnalyze]);

  useEffect(() => {
    if (!isAnalyzing) return;

    const t = setTimeout(() => setTimelineStep(0), 0);
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      setTimelineStep(Math.min(step, 4));
      if (step >= 4) {
        window.clearInterval(interval);
      }
    }, 500);

    return () => {
      clearTimeout(t);
      window.clearInterval(interval);
    };
  }, [isAnalyzing]);

  const handleLoadDemoQuery = () => {
    handleSampleClick(SAMPLE_QUERIES[0]);
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.optimized_query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="max-w-5xl mx-auto px-6 py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Header */}
      <motion.div variants={itemVariants} className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 mb-1">
          <Badge variant="success" dot size="sm">
            Zero-Config Optimizer
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--qs-text-primary)]">
          Database Performance Analysis
        </h1>
        <p className="text-[var(--qs-text-secondary)] text-sm max-w-2xl mx-auto mt-2 mb-6 font-medium">
          Run deterministic rule-based and AI-assisted scalability reviews on your SQL queries.
        </p>

        <div className="max-w-2xl mx-auto rounded-[var(--qs-radius-md)] border border-[var(--qs-border)] bg-[var(--qs-bg-elevated)] px-4 py-2.5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.14em] font-mono text-[var(--qs-text-muted)]">
                Interactive onboarding
              </p>
              <p className="text-sm text-[var(--qs-text-primary)] font-semibold">
                Paste SQL &rarr; Optimize &rarr; Compare &rarr; Present
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadDemoQuery}
            >
              Load Demo Query
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main SQL Editor Panel */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Card
          variant="default"
          padding="none"
          className="overflow-hidden shadow-2xl"
        >
          {/* Editor Tab Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--qs-border)] bg-[var(--qs-bg-secondary)]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--qs-text-muted)] font-mono">
                query.sql
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSchemaInput(!showSchemaInput)}
                className="text-xs font-mono text-[var(--qs-text-muted)] flex items-center gap-1.5 hover:text-[var(--qs-accent)]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10M6 10h10" />
                </svg>
                {showSchemaInput ? "Hide DDL Schema" : "Add Schema Context"}
              </Button>
              <span className="text-xs text-[var(--qs-text-muted)] font-mono">
                • Postgres
              </span>
            </div>
          </div>

          {/* SQL Input (Monaco Editor) */}
          <div className="relative border-b border-[var(--qs-border)]">
            <SQLEditor value={sql} onChange={setSql} />

            {/* Ctrl+Enter Keyboard Shortcut Hint */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] text-[var(--qs-text-muted)] bg-[var(--qs-bg-secondary)] px-2 py-1 rounded border border-[var(--qs-border)]">
              <kbd className="px-1.5 py-0.5 bg-[var(--qs-bg-elevated)] rounded border border-[var(--qs-border)] font-mono">
                {typeof navigator !== "undefined" &&
                /Mac/i.test(navigator.userAgent)
                  ? "⌘"
                  : "Ctrl"}
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-[var(--qs-bg-elevated)] rounded border border-[var(--qs-border)] font-mono">
                Enter
              </kbd>
              <span className="ml-1">to analyze</span>
            </div>
          </div>

          {/* Collapsible Schema Context Input */}
          <AnimatePresence>
            {showSchemaInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] overflow-hidden"
              >
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="schema-context"
                      className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono"
                    >
                      DDL Schema Context (CREATE TABLE statements)
                    </label>
                    <span className="text-[10px] text-[var(--qs-text-muted)] font-mono">
                      Allows precise index & filter validation
                    </span>
                  </div>
                  <textarea
                    id="schema-context"
                    value={schema}
                    onChange={(e) => setSchema(e.target.value)}
                    placeholder={`-- Paste your database CREATE TABLE schemas here...\n-- Example:\n-- CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(10));`}
                    className="w-full h-[120px] p-3 rounded-sm border border-[var(--qs-border)] bg-[var(--qs-bg-primary)] text-[var(--qs-text-primary)] font-mono text-xs outline-none focus:border-[var(--qs-accent)] resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Footer Action bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--qs-bg-secondary)]">
            <div className="text-xs text-[var(--qs-text-muted)]">
              {sql.length} characters • {sql.split("\n").length} lines
            </div>
            <div className="flex gap-2">
              {sql.length > 0 && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setSql("");
                    setError(null);
                    setAnalysisResult(null);
                  }}
                >
                  Clear
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                isLoading={isAnalyzing}
                disabled={!sql.trim()}
                onClick={handleAnalyze}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                }
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Query"}
              </Button>
            </div>
          </div>
        </Card>

        <ExecutionTimeline isActive={isAnalyzing} currentStep={timelineStep} />
      </motion.div>

      {/* Sample Queries Carousel Buttons */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
            Load Demo Sample SQL
          </span>
          <div className="flex-1 h-px bg-[var(--qs-border)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_QUERIES.map((sample) => (
            <Card
              key={sample.id}
              variant="interactive"
              padding="md"
              hover
              onClick={() => handleSampleClick(sample)}
              className="flex flex-col justify-between h-full group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-[var(--qs-text-primary)] group-hover:text-[var(--qs-accent)] transition-colors duration-300">
                    {sample.title}
                  </h3>
                  <Badge
                    variant={
                      sample.severity === "critical" ? "critical" : "warning"
                    }
                    size="sm"
                  >
                    {sample.severity}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--qs-text-muted)] leading-relaxed">
                  {sample.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Error Message display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs md:text-sm rounded-xl"
          >
            <div className="flex items-center gap-2 font-bold font-mono">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              OPTIMIZATION ERROR
            </div>
            <p className="mt-1 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading / Analysis Progress States */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <SkeletonLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Analysis Dashboard Results */}
      <AnimatePresence>
        {analysisResult && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="space-y-6"
          >
            {/* Results Section Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
                Query Intelligence Report
              </span>
              {analysisResult.v3 ? (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Deterministic
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  AI Estimated
                </span>
              )}
              <div className="flex-1 h-px bg-[var(--qs-border)]" />
              <ShareButton analysisResult={analysisResult} />
            </div>

            {/* Section 1 — V3 Executive Summary Bar */}
            {analysisResult.v3?.summary && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="dark:bg-slate-800 bg-slate-50/50 border dark:border-slate-700 border-slate-200 rounded-xl p-4"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {/* Top Risks Chips */}
                  {(analysisResult.v3.summary.topRisks?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-mono text-[var(--qs-text-muted)] uppercase">Risks</span>
                      {analysisResult.v3.summary.topRisks.slice(0, 2).map((risk, i) => {
                        const riskColor =
                          risk.severity === "Critical" ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : risk.severity === "High" ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : risk.severity === "Medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-sky-500/20 text-sky-400 border-sky-500/30";
                        return (
                          <span key={`risk-${i}`} className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${riskColor}`}>
                            {risk.title.length > 40 ? risk.title.slice(0, 40) + "…" : risk.title}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Top Opportunities Chips */}
                  {(analysisResult.v3.summary.topOpportunities?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-mono text-[var(--qs-text-muted)] uppercase">Opportunities</span>
                      {analysisResult.v3.summary.topOpportunities.slice(0, 2).map((opp, i) => {
                        const oppColor =
                          opp.impact === "High" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : opp.impact === "Medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-sky-500/20 text-sky-400 border-sky-500/30";
                        return (
                          <span key={`opp-${i}`} className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${oppColor}`}>
                            {opp.title.length > 40 ? opp.title.slice(0, 40) + "…" : opp.title}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Radial Score Gauge Card */}
              <Card
                variant="default"
                padding="none"
                className="md:col-span-1 flex flex-col items-center justify-center shadow-xl border border-[var(--qs-border)]"
              >
                <ScoreGauge
                  score={analysisResult.v3?.summary.optimizationScore ?? analysisResult.score}
                  severity={analysisResult.severity}
                />
              </Card>

              {/* Performance metrics & summary details */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                {analysisResult.v3 && (
                  <QueryHealthSummary v3={analysisResult.v3} />
                )}
              </div>
            </div>

            {/* Section 4 — V3 Structural Complexity */}
            {analysisResult.v3?.structure && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)] bg-[var(--qs-bg-card)] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--qs-text-muted)] font-mono">
                    Structural Complexity
                  </span>
                  <span className="text-[10px] text-sky-400 font-mono">V3 Engine</span>
                </div>

                <div className="space-y-2.5">
                  {(["join", "aggregation", "nesting", "sorting"] as const).map((dim) => {
                    const level = analysisResult.v3?.structure?.dimensions?.[dim] ?? "LOW";
                    const pct = level === "HIGH" ? 100 : level === "MEDIUM" ? 66 : 33;
                    const color = level === "HIGH" ? "bg-rose-500" : level === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500";
                    const pillColor = level === "HIGH" ? "text-rose-400 bg-rose-500/20" : level === "MEDIUM" ? "text-amber-400 bg-amber-500/20" : "text-emerald-400 bg-emerald-500/20";
                    return (
                      <div key={dim} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase w-24 shrink-0">{dim}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--qs-border)] overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${pillColor}`}>{level}</span>
                      </div>
                    );
                  })}
                </div>

                {analysisResult.v3.structure.metrics && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[var(--qs-border)]">
                    {[
                      { label: "Subqueries", count: analysisResult.v3.structure.metrics.subqueryCount },
                      { label: "CTEs", count: analysisResult.v3.structure.metrics.cteCount },
                      { label: "Unions", count: analysisResult.v3.structure.metrics.unionCount },
                    ].map((chip) => (
                      <span key={chip.label} className="text-[10px] font-mono text-[var(--qs-text-muted)] bg-[var(--qs-bg-secondary)] border border-[var(--qs-border)] px-2.5 py-1 rounded-full">
                        {chip.label}: <span className="text-[var(--qs-text-primary)] font-bold">{chip.count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            <SQLMorph
              from={analysisResult.original_query}
              to={analysisResult.optimized_query}
            />
            <SuccessCelebration show score={analysisResult.score} />

            {/* QueryVision™ — Visual SQL Intelligence Panel */}
            <QueryVision
              analysisResult={analysisResult}
              v3={analysisResult.v3}
            />

            {/* Issues list breakdown */}
            <div className="grid grid-cols-1 gap-6">
              {/* Section 2 — V3 Severity Breakdown Strip */}
              {analysisResult.v3?.health?.severityCounts && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  {([
                    { key: "Critical" as const, color: "bg-rose-500", textColor: "text-rose-400" },
                    { key: "High" as const, color: "bg-orange-500", textColor: "text-orange-400" },
                    { key: "Medium" as const, color: "bg-amber-500", textColor: "text-amber-400" },
                    { key: "Low" as const, color: "bg-sky-500", textColor: "text-sky-400" },
                  ]).map(({ key, color, textColor }) => (
                    <span key={key} className="flex items-center gap-1.5 text-[10px] font-mono bg-[var(--qs-bg-secondary)] border border-[var(--qs-border)] px-2.5 py-1 rounded-full">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-[var(--qs-text-muted)]">{key}</span>
                      <span className={`font-bold ${textColor}`}>{analysisResult.v3?.health?.severityCounts?.[key] ?? 0}</span>
                    </span>
                  ))}
                </motion.div>
              )}
              <IssuesList issues={analysisResult.issues} />
            </div>

            {/* Before/After Diff Viewer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
                  Before / After Optimization Comparison
                </span>
                <Button
                  variant={copied ? "primary" : "ghost"}
                  size="sm"
                  onClick={handleCopy}
                  icon={
                    copied ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )
                  }
                >
                  {copied ? "Copied!" : "Copy Optimized SQL"}
                </Button>
              </div>
              <DiffViewer
                oldValue={analysisResult.original_query}
                newValue={analysisResult.optimized_query}
              />
            </div>

            {/* Section 3 — V3 Index Opportunities Panel */}
            {analysisResult.v3?.indexes && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
                      Index Opportunities
                    </span>
                    <span className="text-[10px] text-[var(--qs-text-muted)] font-mono ml-2">
                      Static analysis — no schema required
                    </span>
                  </div>
                </div>

                {(analysisResult.v3.indexes.opportunities?.length ?? 0) === 0 ? (
                  <div className="flex items-center justify-center p-6 text-center bg-[var(--qs-bg-card)] rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)]">
                    <p className="text-xs text-[var(--qs-text-muted)]">No index opportunities detected</p>
                  </div>
                ) : (
                  <motion.div
                    className="space-y-3"
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
                    initial="hidden"
                    animate="visible"
                  >
                    {analysisResult.v3.indexes.opportunities.map((opp, i) => (
                      <motion.div
                        key={`idx-${i}`}
                        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } }}
                        className="bg-[var(--qs-bg-card)] border border-[var(--qs-border)] rounded-[var(--qs-radius-lg)] p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-[var(--qs-text-primary)]">
                            {opp.tableName || opp.tableAlias}
                          </span>
                          {opp.tableAlias && opp.tableName && (
                            <span className="text-[10px] font-mono text-[var(--qs-text-muted)]">
                              ({opp.tableAlias})
                            </span>
                          )}
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            opp.opportunityType === "Single" ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                            : opp.opportunityType === "Composite" ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          }`}>
                            {opp.opportunityType}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            opp.confidence === "High" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : opp.confidence === "Medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-slate-500/20 dark:text-slate-400 text-slate-500 border-slate-500/30"
                          }`}>
                            {opp.confidence}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {opp.columns.map((col, ci) => (
                            <code key={ci} className="text-[11px] font-mono text-[var(--qs-accent)] bg-[var(--qs-accent-subtle)] px-2 py-0.5 rounded border border-[var(--qs-border)]">
                              {col}
                            </code>
                          ))}
                        </div>
                        <p className="text-xs text-[var(--qs-text-muted)] leading-relaxed">{opp.reasoning}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State Instructions */}
      <AnimatePresence>
        {!analysisResult && !isAnalyzing && (
          <motion.div variants={itemVariants}>
            <Card variant="default" padding="lg" className="text-center">
              <div className="space-y-4 py-8">
                <div className="mx-auto w-12 h-12 rounded bg-[var(--qs-bg-elevated)] border border-[var(--qs-border)] flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--qs-text-muted)"
                    strokeWidth="2"
                  >
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base md:text-lg font-semibold text-[var(--qs-text-primary)]">
                    System Ready
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--qs-text-muted)] max-w-md mx-auto">
                    Provide a SQL query to begin the diagnostic process.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-6 pt-6 border-t border-[var(--qs-border)] max-w-sm mx-auto mt-4">
                  {[
                    { label: "Scan Analysis", value: "Offline" },
                    { label: "AI Scorer", value: "Ready" },
                    { label: "Index Engine", value: "Active" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-xs md:text-sm font-bold text-[var(--qs-text-secondary)]">
                        {stat.value}
                      </div>
                      <div className="text-[9px] text-[var(--qs-text-muted)] uppercase tracking-widest font-mono mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
              WHY QUERYSENSE?
            </span>
            <div className="flex-1 h-px bg-[var(--qs-border)]" />
          </div>
          <p className="text-sm text-[var(--qs-text-secondary)] pl-1">
            Visual SQL Intelligence for Modern Development Workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card variant="default" padding="md" className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">
              Performance Risks Hide in Plain Sight
            </p>
            <p className="text-sm text-[var(--qs-text-secondary)]">
              SQL queries often perform well during development but become
              expensive as data grows. QuerySense identifies structural
              performance risks before deployment.
            </p>
          </Card>

          <Card variant="default" padding="md" className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">
              QueryVision™
            </p>
            <p className="text-sm text-[var(--qs-text-secondary)]">
              QueryVision transforms SQL analysis into visual insights, helping
              developers understand bottlenecks, scaling behavior, and
              optimization opportunities.
            </p>
          </Card>

          <Card variant="default" padding="md" className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">
              Rules + AI
            </p>
            <p className="text-sm text-[var(--qs-text-secondary)]">
              Deterministic SQL rules provide reliability while AI-assisted
              reasoning adds context and optimization suggestions.
            </p>
          </Card>

          <Card variant="default" padding="md" className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">
              Built for Trust
            </p>
            <p className="text-sm text-[var(--qs-text-secondary)]">
              Every recommendation includes confidence, reasoning source, and
              supporting analysis.
            </p>
          </Card>

          <Card variant="default" padding="md" className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">
              Shift Optimization Left
            </p>
            <p className="text-sm text-[var(--qs-text-secondary)]">
              Catch query issues during development instead of after deployment.
              No production database required.
            </p>
          </Card>

          <Card variant="default" padding="md" className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">
              Future Improvements
            </p>
            <p className="text-sm text-[var(--qs-text-secondary)]">
              Multi-dialect SQL support, team workspaces, persistent cloud
              history, and query benchmarking.
            </p>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-6 py-8">
          <SkeletonLoader />
        </div>
      }
    >
      <EditorPageContent />
    </Suspense>
  );
}
