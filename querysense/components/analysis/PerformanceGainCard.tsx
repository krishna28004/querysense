"use client";

import { motion } from "framer-motion";
import { PerformanceMetrics } from "@/lib/analyzer/types";

interface PerformanceGainCardProps {
  metrics: PerformanceMetrics;
}

function pct(before: number, after: number) {
  if (before <= 0) return 0;
  return Math.max(0, Math.round(((before - after) / before) * 100));
}

export default function PerformanceGainCard({ metrics }: PerformanceGainCardProps) {
  const rowGain = pct(metrics.estimated_rows_scanned.before, metrics.estimated_rows_scanned.after);
  const latencyGain = pct(metrics.estimated_time_ms.before, metrics.estimated_time_ms.after);
  const complexityGain = pct(metrics.complexity_score.before, metrics.complexity_score.after);

  const items = [
    { label: "Rows", gain: rowGain, color: "from-emerald-500/30 to-emerald-500/5" },
    { label: "Latency", gain: latencyGain, color: "from-sky-500/30 to-sky-500/5" },
    { label: "Complexity", gain: complexityGain, color: "from-amber-500/30 to-amber-500/5" },
  ];

  return (
    <div className="rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)] bg-[var(--qs-bg-card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--qs-text-muted)] font-mono">
          Live Performance Gain
        </span>
        <span className="text-[10px] text-emerald-400 font-mono">Estimated</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--qs-text-muted)] font-mono uppercase">{item.label}</span>
              <span className="text-xs font-bold text-[var(--qs-text-primary)]">-{item.gain}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--qs-border)] overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${item.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${item.gain}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
