"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// Intelligence UI components
import SQLEditor from "@/components/editor/SQLEditor";
import DiffViewer from "@/components/editor/DiffViewer";
import ScoreGauge from "@/components/analysis/ScoreGauge";
import IssuesList from "@/components/analysis/IssuesList";
import MetricsBar from "@/components/analysis/MetricsBar";
import ExplanationPanel from "@/components/analysis/ExplanationPanel";
import ExecutionTimeline from "@/components/analysis/ExecutionTimeline";
import SQLMorph from "@/components/analysis/SQLMorph";
import SuccessCelebration from "@/components/analysis/SuccessCelebration";
import PerformanceGainCard from "@/components/analysis/PerformanceGainCard";

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

export default function HomePage() {
  const [sql, setSql] = useState("");
  const [schema, setSchema] = useState("");
  const [showSchemaInput, setShowSchemaInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [timelineStep, setTimelineStep] = useState(0);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

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
  }, [sql, isAnalyzing, schema]);

  useEffect(() => {
    if (!isAnalyzing) return;

    setTimelineStep(0);
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      setTimelineStep(Math.min(step, 4));
      if (step >= 4) {
        window.clearInterval(interval);
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
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
    } catch (err: any) {
      setError(err?.message || "An unexpected connection error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    <>
      <Sidebar />
      <main className="flex-1 ml-[var(--qs-sidebar-width)] flex flex-col min-h-screen">
        <Header />

        <div className="flex-1 qs-bg-grid qs-bg-radial">
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
                <Badge variant="info" size="sm">
                  Hackathon Mode
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Paste your SQL.{" "}
                <span className="qs-text-gradient">Get instant intelligence.</span>
              </h1>
              <p className="text-[var(--qs-text-secondary)] text-sm max-w-2xl mx-auto">
                Paste your raw SQL query to instantly run a hybrid rule-based and AI-powered scalability review. No database connections needed.
              </p>

              <div className="max-w-3xl mx-auto rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)] bg-[var(--qs-bg-card)] px-4 py-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-[0.14em] font-mono text-[var(--qs-text-muted)]">Interactive onboarding</p>
                    <p className="text-sm text-[var(--qs-text-primary)] font-semibold">Paste SQL &rarr; Optimize &rarr; Compare &rarr; Present</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleLoadDemoQuery}>
                    Load Demo Query
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Main SQL Editor Panel */}
            <motion.div variants={itemVariants} className="space-y-4">
              <Card variant="default" padding="none" className="overflow-hidden shadow-2xl">
                {/* Editor Tab Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--qs-border)] bg-[var(--qs-bg-secondary)]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                      <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="text-xs text-[var(--qs-text-muted)] ml-2 font-mono">
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                        <path d="M6 6h10M6 10h10" />
                      </svg>
                      {showSchemaInput ? "Hide DDL Schema" : "Add Schema Context"}
                    </Button>
                    <span className="text-xs text-[var(--qs-text-muted)] font-mono">• Postgres</span>
                  </div>
                </div>

                {/* SQL Input (Monaco Editor) */}
                <div className="relative border-b border-[var(--qs-border)]">
                  <SQLEditor value={sql} onChange={setSql} />

                  {/* Ctrl+Enter Keyboard Shortcut Hint */}
                  <AnimatePresence>
                    {sql.length > 0 && !isAnalyzing && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] text-[var(--qs-text-muted)] bg-[#0b0f1990] backdrop-blur-md px-2 py-1 rounded border border-[var(--qs-border)]"
                      >
                        <kbd className="px-1.5 py-0.5 bg-[var(--qs-bg-elevated)] rounded border border-[var(--qs-border)] font-mono">
                          Ctrl
                        </kbd>
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 bg-[var(--qs-bg-elevated)] rounded border border-[var(--qs-border)] font-mono">
                          Enter
                        </kbd>
                        <span className="ml-1">to optimize</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                          <label htmlFor="schema-context" className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
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
                          className="w-full h-[120px] p-3 rounded-lg border border-[var(--qs-border)] bg-[#0b0f19] text-[var(--qs-text-primary)] font-mono text-xs outline-none focus:border-[var(--qs-accent)] resize-none"
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      }
                    >
                      {isAnalyzing ? "Analyzing Performance..." : "Optimize Query"}
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
                  Load Hackathon Demo Sample SQL
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
                        <Badge variant={sample.severity === "critical" ? "critical" : "warning"} size="sm">
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    OPTIMIZATION ERROR
                  </div>
                  <p className="mt-1 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading / Analysis Progress Shimmer States */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <Card variant="glass" padding="lg" className="text-center py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 rounded-full border-4 border-[var(--qs-accent)] border-t-transparent animate-spin" />
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[var(--qs-text-primary)]">
                        Analyzing SQL AST & Statistics...
                      </h3>
                      <p className="text-xs text-[var(--qs-text-muted)] max-w-xs mx-auto">
                        Parsing tokens, checking join conditions, evaluating indexes, and querying semantic LLM engines.
                      </p>
                    </div>
                    <div className="w-full max-w-xl">
                      <ExecutionTimeline isActive currentStep={timelineStep} />
                    </div>
                  </Card>
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
                    <div className="flex-1 h-px bg-[var(--qs-border)]" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* Radial Score Gauge Card */}
                    <Card variant="default" padding="none" className="md:col-span-1 flex flex-col items-center justify-center shadow-xl border border-[var(--qs-border)]">
                      <ScoreGauge score={analysisResult.score} severity={analysisResult.severity} />
                    </Card>

                    {/* Performance metrics & summary details */}
                    <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                      <ExplanationPanel
                        explanation={analysisResult.explanation}
                        whyThisSuggestion={analysisResult.metadata?.why_this_suggestion}
                        reasoningSource={analysisResult.metadata?.reasoning_source}
                        confidence={analysisResult.metadata?.confidence}
                        detectedBy={analysisResult.metadata?.detected_by}
                        executionTimestamp={analysisResult.metadata?.execution_timestamp}
                        aiDisclaimer={analysisResult.ai_disclaimer}
                      />
                      <MetricsBar metrics={analysisResult.metrics} />
                    </div>
                  </div>

                  <PerformanceGainCard metrics={analysisResult.metrics} />
                  <SQLMorph from={analysisResult.original_query} to={analysisResult.optimized_query} />
                  <SuccessCelebration show score={analysisResult.score} />

                  {/* Issues list breakdown */}
                  <div className="grid grid-cols-1 gap-6">
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )
                        }
                      >
                        {copied ? "Copied!" : "Copy Optimized SQL"}
                      </Button>
                    </div>
                    <DiffViewer oldValue={analysisResult.original_query} newValue={analysisResult.optimized_query} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State Instructions */}
            <AnimatePresence>
              {!analysisResult && !isAnalyzing && (
                <motion.div variants={itemVariants}>
                  <Card variant="glass" padding="lg" className="text-center shadow-xl">
                    <div className="space-y-4 py-8">
                      <motion.div
                        className="mx-auto w-14 h-14 rounded-full bg-[var(--qs-accent-subtle)] flex items-center justify-center"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--qs-accent)" strokeWidth="2">
                          <polygon points="12 2 2 22 22 22 12 2" />
                        </svg>
                      </motion.div>
                      <div className="space-y-1">
                        <h3 className="text-base md:text-lg font-bold text-[var(--qs-text-primary)]">
                          Ready to Analyze Query Performance
                        </h3>
                        <p className="text-xs md:text-sm text-[var(--qs-text-muted)] max-w-md mx-auto">
                          Paste your SQL statement into the editor above or select a pre-loaded query from our sample library.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-6 pt-3 border-t border-[var(--qs-border)] max-w-sm mx-auto">
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
                  Hackathon Evaluation Boost
                </span>
                <div className="flex-1 h-px bg-[var(--qs-border)]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card variant="default" padding="md" className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">Problem</p>
                  <p className="text-sm text-[var(--qs-text-secondary)]">
                    Teams ship SQL that works in dev, then breaks under scale with hidden scans, unsafe joins, and exploding latency.
                  </p>
                </Card>

                <Card variant="default" padding="md" className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">How it works</p>
                  <p className="text-sm text-[var(--qs-text-secondary)]">
                    QuerySense fuses deterministic SQL rules with AI reasoning, then produces optimization diffs and impact estimates in seconds.
                  </p>
                </Card>

                <Card variant="glass" padding="md" className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">Innovation</p>
                  <p className="text-sm text-[var(--qs-text-secondary)]">
                    Hybrid scoring with explainability metadata: confidence, reasoning source, detector type, and traceable timestamps.
                  </p>
                </Card>

                <Card variant="glass" padding="md" className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono">Impact metrics</p>
                  <p className="text-sm text-[var(--qs-text-secondary)]">Rows reduced up to 99% in demos, latency drops from seconds to milliseconds, complexity cut by 50%+.</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card variant="interactive" padding="md" onClick={() => setShowArchitectureModal(true)}>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono mb-1">Architecture modal</p>
                  <p className="text-sm text-[var(--qs-text-secondary)]">Open concise system flow: UI &rarr; API &rarr; Rule Engine + AI &rarr; Merger &rarr; SQLite History.</p>
                </Card>
                <Card variant="default" padding="md">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--qs-text-muted)] font-mono mb-1">Future roadmap</p>
                  <p className="text-sm text-[var(--qs-text-secondary)]">Dialect packs, query plan ingestion, team workspaces, and CI performance regression gates.</p>
                </Card>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showArchitectureModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowArchitectureModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="w-full max-w-2xl rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)] bg-[var(--qs-bg-card)] p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[var(--qs-text-primary)]">Architecture Overview</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowArchitectureModal(false)}>Close</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center">
                  {[
                    "UI",
                    "Analyze API",
                    "Rule Engine",
                    "AI Engine",
                    "Merger + SQLite",
                  ].map((step) => (
                    <div key={step} className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] p-2.5 text-xs text-[var(--qs-text-secondary)] font-mono">
                      {step}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </main>
    </>
  );
}
