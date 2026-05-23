"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PerformanceMetrics } from "@/lib/analyzer/types";
import Card from "@/components/ui/Card";

interface MetricsBarProps {
  metrics: PerformanceMetrics;
}

// Utility to format numbers into compact labels (e.g. 1.2M, 24K)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}

interface CounterProps {
  from: number;
  to: number;
  suffix?: string;
  isTime?: boolean;
}

function AnimatedNumber({ from, to, suffix = "", isTime = false }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1500; // 1.5 seconds

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Ease out quad formula for slowing down towards the end
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.round(from + (to - from) * easeProgress);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [from, to]);

  if (isTime) {
    return (
      <span className="font-mono">
        {displayValue >= 1000
          ? `${(displayValue / 1000).toFixed(2)}`
          : displayValue}
        <span className="text-xs font-semibold ml-0.5">{displayValue >= 1000 ? "s" : "ms"}</span>
      </span>
    );
  }

  return <span className="font-mono">{formatNumber(displayValue)}{suffix}</span>;
}

export default function MetricsBar({ metrics }: MetricsBarProps) {
  const rowsSaved = metrics.estimated_rows_scanned.before - metrics.estimated_rows_scanned.after;
  const rowsSavedPercent = metrics.estimated_rows_scanned.before > 0
    ? Math.round((rowsSaved / metrics.estimated_rows_scanned.before) * 100)
    : 0;

  const timeSaved = metrics.estimated_time_ms.before - metrics.estimated_time_ms.after;
  const timeSavedPercent = metrics.estimated_time_ms.before > 0
    ? Math.round((timeSaved / metrics.estimated_time_ms.before) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Rows Scanned Metric */}
      <Card variant="glass" padding="md" className="relative overflow-hidden group">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
              Rows Scanned
            </span>
            {rowsSavedPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">
                -{rowsSavedPercent}%
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--qs-text-primary)]">
              <AnimatedNumber from={metrics.estimated_rows_scanned.before} to={metrics.estimated_rows_scanned.after} />
            </span>
            <span className="text-xs text-[var(--qs-text-muted)] line-through">
              {formatNumber(metrics.estimated_rows_scanned.before)}
            </span>
          </div>

          <div className="w-full bg-[var(--qs-bg-secondary)] h-1.5 rounded-full overflow-hidden">
            <motion.div
              className="bg-emerald-500 h-full rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: `${Math.max(1, 100 - rowsSavedPercent)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-[var(--qs-text-muted)] font-mono">
            EST. IO WORKLOAD REDUCTION
          </p>
        </div>
      </Card>

      {/* 2. Execution Time Metric */}
      <Card variant="glass" padding="md" className="relative overflow-hidden group">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
              Execution Time
            </span>
            {timeSavedPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                -{timeSavedPercent}%
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--qs-text-primary)]">
              <AnimatedNumber from={metrics.estimated_time_ms.before} to={metrics.estimated_time_ms.after} isTime />
            </span>
            <span className="text-xs text-[var(--qs-text-muted)] line-through">
              {metrics.estimated_time_ms.before >= 1000
                ? `${(metrics.estimated_time_ms.before / 1000).toFixed(1)}s`
                : `${metrics.estimated_time_ms.before}ms`}
            </span>
          </div>

          <div className="w-full bg-[var(--qs-bg-secondary)] h-1.5 rounded-full overflow-hidden">
            <motion.div
              className="bg-sky-500 h-full rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: `${Math.max(1, 100 - timeSavedPercent)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-[var(--qs-text-muted)] font-mono">
            EST. LATENCY OVERHEAD SAVED
          </p>
        </div>
      </Card>

      {/* 3. Complexity Score Metric */}
      <Card variant="glass" padding="md" className="relative overflow-hidden group">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
              Query Complexity
            </span>
            <span className="text-[10px] font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
              Scale 0-10
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--qs-text-primary)]">
              <AnimatedNumber from={metrics.complexity_score.before} to={metrics.complexity_score.after} />
            </span>
            <span className="text-xs text-[var(--qs-text-muted)]">
              before: {metrics.complexity_score.before}/10
            </span>
          </div>

          <div className="w-full bg-[var(--qs-bg-secondary)] h-1.5 rounded-full overflow-hidden">
            <motion.div
              className="bg-purple-500 h-full rounded-full"
              initial={{ width: `${metrics.complexity_score.before * 10}%` }}
              animate={{ width: `${metrics.complexity_score.after * 10}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-[var(--qs-text-muted)] font-mono">
            EST. COGNITIVE & AST SIMPLIFICATION
          </p>
        </div>
      </Card>
    </div>
  );
}
