"use client";

import { motion } from "framer-motion";
import { Issue } from "@/lib/analyzer/types";
import IssueCard from "./IssueCard";

interface IssuesListProps {
  issues: Issue[];
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 26 },
  },
};

export default function IssuesList({ issues }: IssuesListProps) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--qs-bg-card)] rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)]">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-[var(--qs-text-primary)] mb-1">
          Zero Query Issues Found!
        </h3>
        <p className="text-xs text-[var(--qs-text-muted)] max-w-sm">
          Your SQL query matches all deterministic rules and exhibits standard scalability structures.
        </p>
      </div>
    );
  }

  // Count issues by severity
  const counts = issues.reduce(
    (acc, issue) => {
      acc[issue.severity]++;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Issues summary header */}
      <div className="flex items-center justify-between text-xs text-[var(--qs-text-muted)] border-b border-[var(--qs-border)] pb-2 font-mono">
        <span>DETECTION HISTORY</span>
        <div className="flex gap-3">
          {counts.critical > 0 && <span className="text-rose-500 font-bold">{counts.critical} Critical</span>}
          {counts.warning > 0 && <span className="text-amber-500 font-bold">{counts.warning} Warning</span>}
          {counts.info > 0 && <span className="text-sky-500 font-bold">{counts.info} Info</span>}
        </div>
      </div>

      <motion.div
        className="space-y-3"
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {issues.map((issue) => (
          <motion.div key={issue.id} variants={cardVariants}>
            <IssueCard issue={issue} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
