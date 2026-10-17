"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Finding } from "@/lib/diagnostics";

const weights = { high: 28, medium: 18, low: 10 } as const;

export function getStructureScore(findings: Finding[]): number {
  return Math.max(20, 100 - findings.reduce((total, finding) => total + weights[finding.severity], 0));
}

export default function StructureScore({ findings }: { findings: Finding[] }) {
  const score = getStructureScore(findings);
  const reduceMotion = useReducedMotion();
  const label = findings.length === 0 ? "No patterns flagged" : score >= 75 ? "Few signals" : score >= 50 ? "Review advised" : "Review needed";
  const tone = score >= 75 ? "calm" : score >= 50 ? "warning" : "alert";

  return <section className={`structure-score score-${tone}`} aria-label="SQL structure signal score">
    <div className="structure-gauge">
      <svg viewBox="0 0 180 180" role="img" aria-label={`${score} out of 100 SQL structure signal score`}>
        <circle cx="90" cy="90" r="70" className="gauge-track" pathLength="100" />
        <motion.circle cx="90" cy="90" r="70" className="gauge-value" pathLength="100" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - score }} transition={{ duration: reduceMotion ? 0 : 1, ease: "easeOut" }} />
      </svg>
      <div className="gauge-readout"><strong>{score}</strong><span> / 100</span></div>
    </div>
    <div className="structure-score-copy">
      <span className="eyebrow">SQL STRUCTURE / RULE SCORE</span>
      <h3>{label}</h3>
      <p>{findings.length} pattern{findings.length === 1 ? "" : "s"} flagged. This score reflects static SQL rules, not speed or query safety.</p>
      <span className="score-method">High −28 · Medium −18 · Low −10</span>
    </div>
  </section>;
}
