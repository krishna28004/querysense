"use client";

import { motion } from "framer-motion";

const STAGES = ["Analyze", "Detect", "Optimize", "Score", "Complete"];

interface ExecutionTimelineProps {
  isActive: boolean;
  currentStep: number;
}

export default function ExecutionTimeline({ isActive, currentStep }: ExecutionTimelineProps) {
  return (
    <div className="rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)] bg-[var(--qs-bg-card)] px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--qs-text-muted)] font-mono">
          Execution Timeline
        </span>
        <span className="text-[10px] text-[var(--qs-text-muted)] font-mono">
          {isActive ? "Running" : "Idle"}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {STAGES.map((stage, index) => {
          const done = index < currentStep;
          const active = isActive && index === currentStep;

          return (
            <div
              key={stage}
              className="relative rounded-[var(--qs-radius-md)] border border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] p-2 text-center"
            >
              <motion.div
                className={`mx-auto mb-1 h-2 w-2 rounded-full ${
                  done ? "bg-emerald-400" : active ? "bg-sky-400" : "bg-[var(--qs-border)]"
                }`}
                animate={active ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
                transition={active ? { duration: 0.8, repeat: Infinity } : { duration: 0.2 }}
              />
              <p className={`text-[10px] font-mono ${done || active ? "text-[var(--qs-text-primary)]" : "text-[var(--qs-text-muted)]"}`}>
                {stage}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
