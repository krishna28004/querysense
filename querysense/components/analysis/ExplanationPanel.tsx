"use client";

import Card from "@/components/ui/Card";

interface ExplanationPanelProps {
  explanation: string;
  whyThisSuggestion?: string;
  reasoningSource?: string;
  confidence?: number;
  detectedBy?: "Rule Engine" | "AI" | "Hybrid";
  executionTimestamp?: string;
  aiDisclaimer?: string;
}

export default function ExplanationPanel({
  explanation,
  whyThisSuggestion,
  reasoningSource,
  confidence,
  detectedBy,
  executionTimestamp,
  aiDisclaimer,
}: ExplanationPanelProps) {
  return (
    <Card variant="glass" padding="md" className="border-l-4 border-l-[var(--qs-accent)]">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--qs-text-muted)] uppercase tracking-wider font-mono">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--qs-accent)]">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14h.01M12 8v4" />
          </svg>
          AI Optimization Summary
        </div>
        <p className="text-xs md:text-sm text-[var(--qs-text-secondary)] leading-relaxed">
          {explanation}
        </p>

        {whyThisSuggestion && (
          <div className="pt-2 border-t border-[var(--qs-border)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--qs-text-muted)] font-mono mb-1">
              Why this suggestion?
            </p>
            <p className="text-xs text-[var(--qs-text-secondary)] leading-relaxed">
              {whyThisSuggestion}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] px-2.5 py-2 text-[var(--qs-text-muted)]">
            Detected by: <span className="text-[var(--qs-text-primary)]">{detectedBy || "Hybrid"}</span>
          </div>
          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] px-2.5 py-2 text-[var(--qs-text-muted)]">
            Confidence: <span className="text-[var(--qs-text-primary)]">{Math.round((confidence ?? 0.82) * 100)}%</span>
          </div>
          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] px-2.5 py-2 text-[var(--qs-text-muted)] sm:col-span-2">
            Reasoning source: <span className="text-[var(--qs-text-primary)]">{reasoningSource || "Static SQL heuristics + semantic pattern matching"}</span>
          </div>
          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] px-2.5 py-2 text-[var(--qs-text-muted)] sm:col-span-2">
            Executed: <span className="text-[var(--qs-text-primary)]">{executionTimestamp || new Date().toISOString()}</span>
          </div>
        </div>

        <p className="text-[10px] text-amber-300/85 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-2 font-mono">
          {aiDisclaimer || "Estimated performance only. Validate with EXPLAIN ANALYZE on production-like data."}
        </p>
      </div>
    </Card>
  );
}
