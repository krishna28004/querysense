"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Issue } from "@/lib/analyzer/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface IssueCardProps {
  issue: Issue;
}

export default function IssueCard({ issue }: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityColorMap = {
    critical: "critical" as const,
    warning: "warning" as const,
    info: "info" as const,
  };

  const badgeVariant = severityColorMap[issue.severity] || "info";

  return (
    <Card
      variant="interactive"
      padding="none"
      onClick={() => setIsExpanded(!isExpanded)}
      className="overflow-hidden cursor-pointer select-none transition-all duration-300 hover:shadow-lg border-l-4 border-l-current"
      style={{
        // Dynamic left border color based on severity
        borderLeftColor:
          issue.severity === "critical"
            ? "#f43f5e" // Rose
            : issue.severity === "warning"
            ? "#f59e0b" // Amber
            : "#0ea5e9", // Sky
      }}
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badgeVariant} size="sm">
              {issue.severity}
            </Badge>
            <span className="text-[10px] text-[var(--qs-text-muted)] font-mono uppercase bg-[var(--qs-bg-secondary)] px-2 py-0.5 rounded border border-[var(--qs-border)]">
              {issue.category.replace(/_/g, " ")}
            </span>
            {issue.line && (
              <span className="text-[10px] text-[var(--qs-accent)] font-mono bg-[var(--qs-accent-subtle)] px-2 py-0.5 rounded">
                Line {issue.line}
              </span>
            )}
            <span className="text-[10px] text-[var(--qs-text-muted)] font-mono">
              Conf: {Math.round(issue.confidence * 100)}% • Source: {issue.source.toUpperCase()}
            </span>
          </div>

          <h3 className="text-sm md:text-base font-bold text-[var(--qs-text-primary)]">
            {issue.title}
          </h3>

          <p className="text-xs md:text-sm text-[var(--qs-text-secondary)] leading-relaxed line-clamp-2">
            {issue.description}
          </p>
        </div>

        {/* Chevron Icon indicating expandability */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[var(--qs-text-muted)] mt-1.5 shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </div>

      {/* Expanded Suggestion details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-t border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] overflow-hidden"
          >
            <div className="p-4 space-y-3.5 text-xs md:text-sm leading-relaxed">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[var(--qs-text-primary)] uppercase tracking-wider text-[var(--qs-text-muted)]">
                  Detailed Explanation
                </span>
                <p className="text-[var(--qs-text-secondary)]">{issue.description}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--qs-text-primary)] uppercase tracking-wider text-[var(--qs-text-muted)]">
                  Step-by-Step Suggestion
                </span>
                <div className="bg-[var(--qs-bg-card)] border border-[var(--qs-border)] rounded-lg p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed text-[var(--qs-accent)]">
                  {issue.suggestion}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
