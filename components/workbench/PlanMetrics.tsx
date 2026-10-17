"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock3, Filter, Rows3 } from "lucide-react";
import type { PlanNode, PlanReport } from "@/lib/plan-analysis";

function removedByFilters(root: PlanNode): number | undefined {
  let found = false;
  let total = 0;
  const visit = (node: PlanNode) => {
    if (node.rowsRemovedByFilter !== undefined) {
      found = true;
      total += node.rowsRemovedByFilter * (node.loops ?? 1);
    }
    node.children.forEach(visit);
  };
  visit(root);
  return found && Number.isSafeInteger(total) ? total : undefined;
}

function rows(value: number | undefined): string {
  return value === undefined || !Number.isSafeInteger(value) ? "—" : new Intl.NumberFormat("en-US", { notation: value >= 1000000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export default function PlanMetrics({ plan, demo, onAddPlan }: { plan?: PlanReport; demo: boolean; onAddPlan: () => void }) {
  const reduceMotion = useReducedMotion();
  const measured = plan?.kind === "measured";
  const output = measured && plan.root.actualRows !== undefined ? plan.root.actualRows * (plan.root.loops ?? 1) : undefined;
  const filtered = measured ? removedByFilters(plan.root) : undefined;
  const duration = measured ? plan.executionTimeMs : undefined;
  const metrics = [
    { key: "time", icon: Clock3, label: "Execution time", value: duration === undefined ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(duration), unit: duration === undefined ? "" : "ms", note: duration === undefined ? "Requires measured EXPLAIN JSON" : "Reported by the supplied plan", tone: "coral" },
    { key: "filtered", icon: Filter, label: "Rows removed", value: rows(filtered), unit: "", note: filtered === undefined ? "No filter counter available" : "Filter counters × loops · not rows scanned", tone: "amber" },
    { key: "output", icon: Rows3, label: !plan || measured ? "Output rows" : "Estimated output", value: rows(output ?? (!measured ? plan?.root.estimatedRows : undefined)), unit: "", note: measured ? "Root node rows × loops" : plan ? "Planner estimate · not measured" : "Add a plan to see row counts", tone: "mint" },
  ] as const;

  return <section className="plan-metrics" aria-label="Query plan metrics">
    <div className="plan-metrics-heading"><div><span className="eyebrow">PLAN TELEMETRY / 03</span><h3>What the database reported</h3></div><span className={`plan-source-tag ${measured ? "source-measured" : ""}`}>{demo ? "DEMO FIXTURE" : measured ? "MEASURED PLAN" : plan ? "ESTIMATED PLAN" : "NO PLAN PROVIDED"}</span></div>
    <div className="plan-metrics-grid">{metrics.map((metric, index) => <motion.article key={metric.key} className={`metric-tile metric-${metric.tone}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .35, delay: reduceMotion ? 0 : index * .07 }}>
      <div className="metric-top"><span className="metric-icon"><metric.icon size={18} aria-hidden="true"/></span><span className="metric-label">{metric.label}</span></div>
      <div className="metric-value"><strong>{metric.value}</strong>{metric.unit && <span>{metric.unit}</span>}</div>
      <div className="metric-rule" aria-hidden="true"><span/></div>
      <p>{metric.note}</p>
    </motion.article>)}</div>
    {!plan && <button type="button" className="metrics-add-plan" onClick={onAddPlan}>Have a PostgreSQL plan? Add it to see actual evidence <span aria-hidden="true">↗</span></button>}
    {demo && <p className="metric-disclaimer">Illustrative fixture numbers. They are not a measurement of your database.</p>}
  </section>;
}
