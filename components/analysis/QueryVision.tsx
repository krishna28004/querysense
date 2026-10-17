"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnalysisResponse } from "@/lib/analyzer/types";
import { AnalysisReportV3 } from "@/lib/analyzer/core/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface QueryVisionProps {
  analysisResult: AnalysisResponse;
  v3?: AnalysisReportV3;
}

const HEATMAP_PATTERNS = [
  {
    regex: /(SELECT\s+\*)/gi,
    name: "SELECT *",
    impact: "Unnecessary I/O & memory bloat",
    fix: "Define specific columns",
    classes: "border-[var(--qs-error)]/50 bg-[var(--qs-error-bg)] text-[var(--qs-error)]",
  },
  {
    regex: /\b(JOIN)\b/gi,
    name: "JOIN",
    impact: "Index miss leads to full scan",
    fix: "Verify covering indexes",
    classes: "border-[var(--qs-warning)]/50 bg-[var(--qs-warning-bg)] text-[var(--qs-warning)]",
  },
  {
    regex: /(\(\s*SELECT\b)/gi,
    name: "SUBQUERY",
    impact: "Nested loop execution risk",
    fix: "Flatten with CTE or JOIN",
    classes: "border-[var(--qs-accent)]/50 bg-[var(--qs-accent-subtle)] text-[var(--qs-accent)]",
  },
  {
    regex: /(ORDER\s+BY)/gi,
    name: "ORDER BY (Missing LIMIT)",
    impact: "Expensive in-memory sort",
    fix: "Add LIMIT clause",
    classes: "border-[var(--qs-warning)]/50 bg-[var(--qs-warning-bg)] text-[var(--qs-warning)]",
  }
];

export default function QueryVision({ analysisResult, v3 }: QueryVisionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Smooth scroll into view shortly after render
    const timer = setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Generate heatmap HTML
  let heatmapHtml = analysisResult.original_query
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  HEATMAP_PATTERNS.forEach(pattern => {
    heatmapHtml = heatmapHtml.replace(pattern.regex, (match) => {
      return `<span class="relative group cursor-pointer border-b-2 px-1 rounded-sm transition-all hover:bg-opacity-80 ${pattern.classes}">
        ${match}
        <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-56 p-3 rounded-lg bg-[var(--qs-bg-elevated)] border border-[var(--qs-border)] shadow-[var(--qs-shadow-lg)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
          <span class="block text-[10px] uppercase font-mono text-[var(--qs-text-muted)] mb-1">${pattern.name}</span>
          <span class="block text-xs text-[var(--qs-text-primary)] mb-2"><span class="text-[var(--qs-error)] font-bold">Impact:</span> ${pattern.impact}</span>
          <span class="block text-xs text-[var(--qs-text-primary)]"><span class="text-[var(--qs-success)] font-bold">Fix:</span> ${pattern.fix}</span>
        </span>
      </span>`;
    });
  });

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
      }}
      className="w-full flex flex-col border border-[var(--qs-border)] rounded-xl shadow-[var(--qs-shadow-lg)] bg-[var(--qs-bg-card)] mt-6 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-5 border-b border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] relative">
        <h2 className="text-xl md:text-2xl font-black text-[var(--qs-text-primary)] tracking-widest flex flex-col md:flex-row items-center gap-3 relative z-10">
          QUERYVISION™
          <Badge variant="info" size="sm" className="hidden md:flex">No DB • Pre-deployment • Explainable</Badge>
        </h2>
        <Badge variant="info" size="sm" className="mt-2 md:hidden">No DB • Pre-deployment • Explainable</Badge>
        <p className="text-[10px] md:text-xs text-[var(--qs-text-muted)] font-mono uppercase tracking-widest mt-2 relative z-10">
          Visual SQL Intelligence
        </p>
        <p className="text-xs md:text-sm text-[var(--qs-text-secondary)] mt-2 text-center px-4 relative z-10">
          Understand where your SQL breaks, how it scales, and how to fix it.
        </p>
      </div>

      {/* Grid Layout 60/40 */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left Column (60%) - Heatmap */}
        <motion.div variants={itemVariants} className="w-full lg:w-[60%] p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-[var(--qs-border)] flex flex-col bg-[var(--qs-bg-secondary)]/50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-mono text-[var(--qs-text-secondary)] uppercase tracking-wider font-bold">
              Where the problem lives
            </div>
            <Badge variant="warning" size="sm" className="hidden sm:flex">Hover issues to view impact</Badge>
          </div>
          <div
            className="font-mono text-sm leading-loose whitespace-pre-wrap text-[var(--qs-text-secondary)] p-4 sm:p-6 bg-[var(--qs-bg-primary)] rounded-lg border border-[var(--qs-border)] shadow-inner flex-1 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: heatmapHtml }}
          />
        </motion.div>

        {/* Right Column (40%) - Stacked Content */}
        <div className="w-full lg:w-[40%] flex flex-col bg-[var(--qs-bg-card)] divide-y divide-[var(--qs-border)]">

          {/* Insight Summary */}
          <motion.div variants={itemVariants} className="p-4 flex flex-col justify-center">
            <div className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase tracking-wider mb-2">Insight Summary</div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-[var(--qs-text-primary)]">{analysisResult.issues.length}</span>
                <span className="text-xs text-[var(--qs-text-muted)]">Issues</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-[var(--qs-success)]">{analysisResult.metadata?.confidence || 95}%</span>
                <span className="text-xs text-[var(--qs-text-muted)]">Confidence</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="warning" size="sm">{analysisResult.metadata?.recommendation_badge || "REVIEW"}</Badge>
              <Badge variant="info" size="sm">Detected by: {analysisResult.metadata?.detected_by || "Hybrid"}</Badge>
            </div>

            {/* V3 Join Metrics Row */}
            {v3?.joins?.metrics && v3.joins.metrics.joinCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--qs-border)]">
                {[
                  { label: "Tables", value: v3.joins.metrics.tableCount },
                  { label: "Joins", value: v3.joins.metrics.joinCount },
                  { label: "Depth", value: v3.joins.metrics.joinDepth },
                ].map((stat) => (
                  <span key={stat.label} className="flex items-center gap-1.5 text-[10px] font-mono bg-[var(--qs-bg-primary)] border border-[var(--qs-border)] px-2.5 py-1 rounded-full">
                    <span className="text-[var(--qs-text-muted)]">{stat.label}</span>
                    <span className="text-[var(--qs-text-primary)] font-bold">{stat.value}</span>
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Smart Impact Engine */}
          <motion.div variants={itemVariants} className="p-4 flex flex-col justify-center">
            <div className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase tracking-wider mb-2">What this costs</div>
            <p className="text-xs text-[var(--qs-text-muted)] italic py-4">
              Performance metrics require execution plan — coming in Phase 3
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-4 flex flex-col justify-center">
            {(() => {
              const hasComplexDimensions = v3?.structure?.dimensions && Object.values(v3.structure.dimensions).some(val => val !== "LOW");
              return (
                <>
                  <div className="flex justify-between items-end mb-3">
                    <div className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase tracking-wider">How this behaves at scale</div>
                    <div className="text-[9px] text-[var(--qs-warning)] uppercase">{hasComplexDimensions ? "V3 Analysis" : "Relative Cost"}</div>
                  </div>

                  {hasComplexDimensions ? (
              <>
                <div className="space-y-2.5">
                  {(["join", "aggregation", "nesting", "sorting"] as const).map((dim) => {
                    const level = v3.structure?.dimensions?.[dim] ?? "LOW";
                    const pct = level === "HIGH" ? 100 : level === "MEDIUM" ? 66 : 33;
                    const barColor = level === "HIGH" ? "bg-[var(--qs-error)]" : level === "MEDIUM" ? "bg-[var(--qs-warning)]" : "bg-[var(--qs-success)]";
                    const labelColor = level === "HIGH" ? "text-[var(--qs-error)]" : level === "MEDIUM" ? "text-[var(--qs-warning)]" : "text-[var(--qs-success)]";
                    return (
                      <div key={dim} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[var(--qs-text-secondary)] uppercase w-20 shrink-0">{dim}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--qs-border)] overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <span className={`text-[9px] font-bold font-mono ${labelColor}`}>{level}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-[var(--qs-text-muted)] text-center mt-3 italic">
                  *Complexity dimensions from V3 static analysis.
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center py-6">
                <span className="text-xs text-[var(--qs-text-muted)] italic">Structural complexity analysis unavailable for this query</span>
              </div>
            )}
              </>
            );
          })()}
          </motion.div>

          {/* Generated SQL Fix */}
          <motion.div variants={itemVariants} className="p-4 flex flex-col justify-center">
            <div className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase tracking-wider mb-2">Ready to apply</div>
            <div className="relative group flex-1">
              <pre className="font-mono text-[10px] text-[var(--qs-success)] p-3 bg-[var(--qs-bg-primary)] rounded border border-[var(--qs-border)] overflow-hidden whitespace-pre-wrap h-full max-h-[100px] overflow-y-auto shadow-inner">
                {analysisResult.optimized_query}
              </pre>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" className="flex-1 text-[10px] font-mono tracking-wider h-7" onClick={() => navigator.clipboard.writeText(analysisResult.optimized_query)}>
                Copy
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 text-[10px] font-mono tracking-wider h-7">
                Export
              </Button>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
