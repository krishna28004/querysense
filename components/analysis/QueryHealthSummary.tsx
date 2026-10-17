"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { AnalysisReportV3 } from "@/lib/analyzer/core/types";

interface QueryHealthSummaryProps {
  v3: AnalysisReportV3;
}

export default function QueryHealthSummary({ v3 }: QueryHealthSummaryProps) {
  const { severityCounts } = v3.health;
  const topRisk = v3.summary.topRisks[0];
  const topOpp = v3.summary.topOpportunities[0];

  return (
    <Card variant="glass" padding="md" className="border-l-4 border-l-[var(--qs-accent)]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--qs-accent)]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          QUERY HEALTH SUMMARY
        </div>

        {/* Section 1 — Severity counts row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center justify-center p-2 rounded-[var(--qs-radius-sm)] border border-[var(--qs-error)]/20 bg-[var(--qs-error-bg)]">
            <span className="text-xl font-bold text-[var(--qs-error)] font-mono">{severityCounts.Critical || 0}</span>
            <span className="text-[10px] text-[var(--qs-text-muted)] uppercase tracking-widest mt-1">Critical</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-[var(--qs-radius-sm)] border border-[var(--qs-warning)]/20 bg-[var(--qs-warning-bg)]">
            <span className="text-xl font-bold text-[var(--qs-warning)] font-mono">{severityCounts.High || 0}</span>
            <span className="text-[10px] text-[var(--qs-text-muted)] uppercase tracking-widest mt-1">High</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-[var(--qs-radius-sm)] border border-[var(--qs-accent)]/20 bg-[var(--qs-accent-subtle)]">
            <span className="text-xl font-bold text-[var(--qs-accent)] font-mono">{severityCounts.Medium || 0}</span>
            <span className="text-[10px] text-[var(--qs-text-muted)] uppercase tracking-widest mt-1">Medium</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-[var(--qs-radius-sm)] border border-[var(--qs-info)]/20 bg-[var(--qs-info-bg)]">
            <span className="text-xl font-bold text-[var(--qs-info)] font-mono">{severityCounts.Low || 0}</span>
            <span className="text-[10px] text-[var(--qs-text-muted)] uppercase tracking-widest mt-1">Low</span>
          </div>
        </div>

        {/* Section 2 — Top Risk */}
        <div className="pt-2 border-t border-[var(--qs-border)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--qs-text-muted)] font-mono mb-2">
            TOP RISK
          </p>
          {topRisk ? (
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <Badge variant={topRisk.severity === "Critical" ? "critical" : "warning"} size="sm">
                  {topRisk.severity}
                </Badge>
                <span className="text-xs font-semibold text-[var(--qs-text-primary)]">{topRisk.title}</span>
              </div>
              <p className="text-[11px] text-[var(--qs-text-secondary)] leading-relaxed mt-1">
                {topRisk.description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--qs-success)] font-medium">No critical risks detected</p>
          )}
        </div>

        {/* Section 3 — Top Opportunity */}
        <div className="pt-2 border-t border-[var(--qs-border)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--qs-text-muted)] font-mono mb-2">
            TOP OPPORTUNITY
          </p>
          {topOpp ? (
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <Badge variant={topOpp.impact === "High" ? "success" : "info"} size="sm">
                  {topOpp.impact} Impact
                </Badge>
                <span className="text-xs font-semibold text-[var(--qs-text-primary)]">{topOpp.title}</span>
              </div>
              <p className="text-[11px] text-[var(--qs-text-secondary)] leading-relaxed mt-1">
                {topOpp.description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--qs-text-muted)] italic">No optimization opportunities detected</p>
          )}
        </div>
      </div>
    </Card>
  );
}
