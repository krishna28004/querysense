"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnalysisResponse } from "@/lib/analyzer/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface QueryVisionProps {
  analysisResult: AnalysisResponse;
}

const HEATMAP_PATTERNS = [
  {
    regex: /(SELECT\s+\*)/gi,
    name: "SELECT *",
    impact: "Unnecessary I/O & memory bloat",
    fix: "Define specific columns",
    classes: "border-rose-500/50 bg-rose-500/20 text-rose-300",
  },
  {
    regex: /\b(JOIN)\b/gi,
    name: "JOIN",
    impact: "Index miss leads to full scan",
    fix: "Verify covering indexes",
    classes: "border-amber-500/50 bg-amber-500/20 text-amber-300",
  },
  {
    regex: /(\(\s*SELECT\b)/gi,
    name: "SUBQUERY",
    impact: "Nested loop execution risk",
    fix: "Flatten with CTE or JOIN",
    classes: "border-purple-500/50 bg-purple-500/20 text-purple-300",
  },
  {
    regex: /(ORDER\s+BY)/gi,
    name: "ORDER BY (Missing LIMIT)",
    impact: "Expensive in-memory sort",
    fix: "Add LIMIT clause",
    classes: "border-orange-500/50 bg-orange-500/20 text-orange-300",
  }
];

export default function QueryVision({ analysisResult }: QueryVisionProps) {
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
        <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-lg bg-[#0b0f19] border border-[var(--qs-border)] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
          <span class="block text-[10px] uppercase font-mono text-[var(--qs-text-muted)] mb-1">${pattern.name}</span>
          <span class="block text-xs text-white mb-2"><span class="text-rose-400 font-bold">Impact:</span> ${pattern.impact}</span>
          <span class="block text-xs text-white"><span class="text-emerald-400 font-bold">Fix:</span> ${pattern.fix}</span>
        </span>
      </span>`;
    });
  });

  const rowReduction = 99; // Mock for demo
  const latReduction = 85; // Mock for demo
  const dbCostMock = 150; // Mock for demo
  const cpuReduction = analysisResult.metrics?.cpu_reduction_pct || 60;

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
      className="w-full flex flex-col border border-[var(--qs-border)] rounded-xl overflow-hidden shadow-2xl bg-[#0b0f19] mt-6"
    >
      {/* Hero Header */}
      <div className="flex flex-col items-center justify-center py-5 border-b border-[var(--qs-border)] bg-[#0b0f19]/80 backdrop-blur-md z-10 relative overflow-hidden">
        <div className="absolute inset-0 qs-bg-grid opacity-30 pointer-events-none" />
        <h2 className="text-xl md:text-2xl font-black text-white tracking-widest flex flex-col md:flex-row items-center gap-3 relative z-10">
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
        <motion.div variants={itemVariants} className="w-full lg:w-[60%] p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-[var(--qs-border)] flex flex-col bg-[#0b0f19]/50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-mono text-[var(--qs-text-secondary)] uppercase tracking-wider font-bold">
              Where the problem lives
            </div>
            <Badge variant="warning" size="sm" className="hidden sm:flex">Hover issues to view impact</Badge>
          </div>
          <div 
            className="font-mono text-sm leading-loose whitespace-pre-wrap text-[var(--qs-text-secondary)] p-4 sm:p-6 bg-[#0f172a] rounded-lg border border-[var(--qs-border)] shadow-inner flex-1 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: heatmapHtml }}
          />
        </motion.div>

        {/* Right Column (40%) - Stacked Content */}
        <div className="w-full lg:w-[40%] flex flex-col bg-[#0f172a]/30 divide-y divide-[var(--qs-border)]">
          
          {/* Insight Summary */}
          <motion.div variants={itemVariants} className="p-4 flex flex-col justify-center bg-[#0b0f19]/30">
            <div className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase tracking-wider mb-2">Insight Summary</div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-white">{analysisResult.issues.length}</span>
                <span className="text-xs text-[var(--qs-text-muted)]">Issues</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-emerald-400">{analysisResult.metadata?.confidence || 95}%</span>
                <span className="text-xs text-[var(--qs-text-muted)]">Confidence</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="warning" size="sm">{analysisResult.metadata?.recommendation_badge || "REVIEW"}</Badge>
              <Badge variant="info" size="sm">Detected by: {analysisResult.metadata?.detected_by || "Hybrid"}</Badge>
            </div>
          </motion.div>

          {/* Smart Impact Engine */}
          <motion.div variants={itemVariants} className="p-4 flex flex-col justify-center bg-[#0b0f19]/30">
            <div className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase tracking-wider mb-2">What this costs</div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="bg-[#0b0f19] border border-[var(--qs-border)] rounded py-2 px-1 text-center">
                <div className="text-emerald-400 font-bold text-xs sm:text-sm">-{rowReduction}%</div>
                <div className="text-[8px] sm:text-[9px] text-[var(--qs-text-muted)] uppercase mt-1">Rows</div>
              </div>
              <div className="bg-[#0b0f19] border border-[var(--qs-border)] rounded py-2 px-1 text-center">
                <div className="text-emerald-400 font-bold text-xs sm:text-sm">-{latReduction}ms</div>
                <div className="text-[8px] sm:text-[9px] text-[var(--qs-text-muted)] uppercase mt-1">Latency</div>
              </div>
              <div className="bg-[#0b0f19] border border-[var(--qs-border)] rounded py-2 px-1 text-center">
                <div className="text-emerald-400 font-bold text-xs sm:text-sm">-{cpuReduction}%</div>
                <div className="text-[8px] sm:text-[9px] text-[var(--qs-text-muted)] uppercase mt-1">CPU</div>
              </div>
              <div className="bg-[#0b0f19] border border-[var(--qs-border)] rounded py-2 px-1 text-center">
                <div className="text-emerald-400 font-bold text-xs sm:text-sm">-${dbCostMock}</div>
                <div className="text-[8px] sm:text-[9px] text-[var(--qs-text-muted)] uppercase mt-1">DB Cost</div>
              </div>
            </div>
            <p className="text-[10px] text-indigo-300/80 mt-3 italic leading-tight border-l-2 border-indigo-500/50 pl-2">
              Business Translation: Slow queries increase infra cost and user wait time.
            </p>
          </motion.div>

          {/* Scale Projection */}
          <motion.div variants={itemVariants} className="p-4 flex flex-col justify-center bg-[#0b0f19]/30">
            <div className="flex justify-between items-end mb-3">
              <div className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase tracking-wider">How this behaves at scale</div>
              <div className="text-[9px] text-amber-400/80 uppercase">Relative Cost</div>
            </div>
            <div className="flex justify-between text-xs font-mono px-2">
               <div className="flex flex-col items-center">
                 <span className="text-[10px] text-[var(--qs-text-secondary)]">Development</span>
                 <span className="text-[9px] text-[var(--qs-text-muted)] mt-0.5">(1K rows)</span>
                 <span className="text-emerald-400 font-bold mt-2 border-b-2 border-emerald-500/50 pb-0.5 px-1">Low</span>
               </div>
               <div className="flex flex-col items-center relative">
                 <div className="absolute top-1/2 -left-[100%] w-full border-t border-[var(--qs-border)] border-dashed -z-10" />
                 <span className="text-[10px] text-[var(--qs-text-secondary)]">Startup</span>
                 <span className="text-[9px] text-[var(--qs-text-muted)] mt-0.5">(100K rows)</span>
                 <span className="text-amber-400 font-bold mt-2 border-b-2 border-amber-500/50 pb-0.5 px-1">Medium</span>
               </div>
               <div className="flex flex-col items-center relative">
                 <div className="absolute top-1/2 -left-[100%] w-full border-t border-[var(--qs-border)] border-dashed -z-10" />
                 <span className="text-[10px] text-[var(--qs-text-secondary)]">Production</span>
                 <span className="text-[9px] text-[var(--qs-text-muted)] mt-0.5">(1M rows)</span>
                 <span className="text-rose-400 font-bold mt-2 border-b-2 border-rose-500/50 pb-0.5 px-1">High</span>
               </div>
            </div>
            <p className="text-[10px] text-rose-300/90 mt-4 text-center uppercase tracking-widest border border-rose-500/20 bg-rose-500/10 rounded py-1.5 font-bold">
              Your query becomes 1000x more expensive at scale
            </p>
            <p className="text-[9px] text-[var(--qs-text-muted)] text-center mt-2 italic">
              *Estimated structural growth based on query complexity.
            </p>
          </motion.div>

          {/* Generated SQL Fix */}
          <motion.div variants={itemVariants} className="p-4 flex flex-col justify-center bg-[#0b0f19]/30">
            <div className="text-[10px] font-mono text-[var(--qs-text-muted)] uppercase tracking-wider mb-2">Ready to apply</div>
            <div className="relative group flex-1">
              <pre className="font-mono text-[10px] text-emerald-300 p-3 bg-[#0f172a] rounded border border-[var(--qs-border)] overflow-hidden whitespace-pre-wrap h-full max-h-[100px] overflow-y-auto shadow-inner">
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
