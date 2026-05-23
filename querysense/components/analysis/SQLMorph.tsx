"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface SQLMorphProps {
  from: string;
  to: string;
}

export default function SQLMorph({ from, to }: SQLMorphProps) {
  const preview = useMemo(() => {
    const before = from.split("\n").slice(0, 3).join(" ").trim();
    const after = to.split("\n").slice(0, 3).join(" ").trim();
    return { before: before.slice(0, 120), after: after.slice(0, 120) };
  }, [from, to]);

  return (
    <div className="rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)] bg-[var(--qs-bg-card)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--qs-text-muted)] font-mono">
          SQL Transformation
        </span>
        <span className="text-[10px] text-emerald-400 font-mono">Before to After</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg border border-rose-500/25 bg-rose-500/8 px-3 py-2"
        >
          <p className="text-[9px] uppercase tracking-wider text-rose-300 mb-1 font-mono">Original</p>
          <p className="text-xs text-[var(--qs-text-secondary)] font-mono break-words">{preview.before || "-"}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2"
        >
          <p className="text-[9px] uppercase tracking-wider text-emerald-300 mb-1 font-mono">Optimized</p>
          <p className="text-xs text-[var(--qs-text-secondary)] font-mono break-words">{preview.after || "-"}</p>
        </motion.div>
      </div>
    </div>
  );
}
