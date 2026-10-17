"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, BookmarkPlus, Check, Clipboard, Download, FileCode2, FlaskConical, Info, Layers3, LoaderCircle, LockKeyhole, Sparkles, TerminalSquare, TriangleAlert, Zap } from "lucide-react";
import Nav from "@/components/workbench/Nav";
import type { Finding, SqlReport } from "@/lib/diagnostics";
import type { PlanNode, PlanReport } from "@/lib/plan-analysis";
import type { PlanComparison } from "@/lib/plan-comparison";
import type { AIReview } from "@/lib/ai-review";
import { loadHistory, saveAnalysis } from "@/lib/local-history";
import StructureScore from "@/components/workbench/StructureScore";
import DiffViewer from "@/components/editor/DiffViewer";
import WorkloadExplorer from "@/components/workbench/WorkloadExplorer";
import PlanMetrics from "@/components/workbench/PlanMetrics";

type ResponseData = { sql: SqlReport; candidateSql?: SqlReport; plan?: PlanReport; candidatePlan?: PlanReport; comparison?: PlanComparison; ai?: AIReview; aiStatus: "not_requested" | "completed" | "unavailable" | "context_limit"; analyzedAt: string };

const demoSql = `SELECT *\nFROM orders\nWHERE status = 'open'\nORDER BY created_at DESC\nLIMIT 50;`;
const demoPlan = JSON.stringify([{ "Plan": { "Node Type": "Limit", "Plan Rows": 50, "Actual Rows": 50, "Actual Loops": 1, "Actual Total Time": 38.1, "Total Cost": 140.2, "Plans": [{ "Node Type": "Sort", "Plan Rows": 1200, "Actual Rows": 50, "Actual Loops": 1, "Actual Total Time": 38.0, "Sort Method": "quicksort", "Plans": [{ "Node Type": "Seq Scan", "Relation Name": "orders", "Plan Rows": 1200, "Actual Rows": 120, "Actual Loops": 1, "Actual Total Time": 34.2, "Rows Removed by Filter": 24680, "Shared Read Blocks": 186 }] }] }, "Planning Time": 0.3, "Execution Time": 38.4 }], null, 2);
const sampleQueries = [
  { name: "Orders scan", sql: demoSql },
  { name: "Leading wildcard", sql: "SELECT id, email\nFROM users\nWHERE email ILIKE '%@example.com';" },
  { name: "Function on filter", sql: "SELECT id, email\nFROM users\nWHERE LOWER(email) = 'dev@example.com';" },
  { name: "Deep pagination", sql: "SELECT id, created_at\nFROM events\nORDER BY created_at DESC\nLIMIT 25 OFFSET 5000;" },
  { name: "Join inspection", sql: "SELECT o.id, c.name\nFROM orders AS o\nJOIN customers AS c ON c.id = o.customer_id\nWHERE o.status = 'open';" },
];

function PlanBranch({ node, depth = 0 }: { node: PlanNode; depth?: number }) {
  const metrics = [
    node.actualRows !== undefined && `${node.actualRows.toLocaleString()} actual rows`,
    node.estimatedRows !== undefined && `${node.estimatedRows.toLocaleString()} estimated`,
    node.loops !== undefined && `${node.loops.toLocaleString()} loops`,
    node.actualTimeMs !== undefined && `${node.actualTimeMs} ms/node`,
    node.totalCost !== undefined && `${node.totalCost} cost units`,
    node.sharedHitBlocks !== undefined && `${node.sharedHitBlocks} shared hits`,
    node.sharedReadBlocks !== undefined && `${node.sharedReadBlocks} shared reads`,
    node.rowsRemovedByFilter !== undefined && `${node.rowsRemovedByFilter.toLocaleString()} removed by filter`,
    node.tempReadBlocks !== undefined && `${node.tempReadBlocks} temp reads`,
    node.tempWrittenBlocks !== undefined && `${node.tempWrittenBlocks} temp writes`,
    node.hashBatches !== undefined && `${node.hashBatches} hash batches`,
    node.sortMethod && `${node.sortMethod}${node.sortSpaceUsedKb !== undefined ? ` · ${node.sortSpaceUsedKb} kB` : ""}`,
  ].filter((value): value is string => Boolean(value));
  return <div className="plan-branch" style={{ marginLeft: depth ? 18 : 0 }}>
    <div className="plan-node">
      <span className="plan-node-dot" />
      <strong>{node.label}{node.relation ? <span> · {node.relation}</span> : null}</strong>
      {metrics.length > 0 && <div className="plan-node-metrics">{metrics.map(metric => <span key={metric}>{metric}</span>)}</div>}
      {(node.filter || node.indexCondition) && <div className="plan-node-conditions">{node.filter && <p><b>Filter</b><code>{node.filter}</code></p>}{node.indexCondition && <p><b>Index condition</b><code>{node.indexCondition}</code></p>}</div>}
    </div>
    {node.children.map((child, index) => <PlanBranch key={`${depth}-${index}-${child.label}`} node={child} depth={depth + 1} />)}
  </div>;
}

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  return <motion.article className={`finding-card finding-${finding.severity}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .06, .3) }}>
    <div className="finding-top"><span className="finding-index">{String(index + 1).padStart(2, "0")}</span><span className={`severity severity-${finding.severity}`}>{finding.severity}</span><span className="source-label">{finding.source === "plan" ? "PLAN EVIDENCE" : "SQL STRUCTURE"}</span></div>
    <h3>{finding.title}</h3>
    <div className="finding-action"><span className="eyebrow">REVIEW THIS</span><p>{finding.action}</p></div>
    <details className="finding-details"><summary>Evidence and how to validate</summary><div className="evidence-strip"><span>OBSERVED</span><code>{finding.evidence}</code></div><p>{finding.explanation}</p><p><strong>Check:</strong> {finding.verify}</p></details>
  </motion.article>;
}

function EditorContent() {
  const params = useSearchParams();
  const [sql, setSql] = useState("");
  const [candidateSql, setCandidateSql] = useState("");
  const [checkedCandidate, setCheckedCandidate] = useState("");
  const [plan, setPlan] = useState("");
  const [candidatePlan, setCandidatePlan] = useState("");
  const [schema, setSchema] = useState("");
  const [includeAI, setIncludeAI] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [result, setResult] = useState<ResponseData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(-1);
  const [sampleLabel, setSampleLabel] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [candidateCopied, setCandidateCopied] = useState(false);
  const [showCandidateEditor, setShowCandidateEditor] = useState(false);

  useEffect(() => {
    try {
      const savedFontSize = Number(window.localStorage.getItem("querysense-editor-font-size"));
      if (Number.isFinite(savedFontSize) && savedFontSize >= 12 && savedFontSize <= 20) {
        document.documentElement.style.setProperty("--query-editor-font-size", `${savedFontSize}px`);
      }
    } catch {
      // Keep the default editor size if local browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const id = params.get("from");
      if (id) {
        const item = loadHistory().find(entry => entry.id === id);
        if (item) { setSql(item.sql); setCandidateSql(item.candidateSql || ""); setPlan(item.plan || ""); setCandidatePlan(item.candidatePlan || ""); }
      }
      const sample = params.get("sample");
      if (sample === "orders") { setSql(demoSql); setPlan(demoPlan); setDemo(true); setSampleIndex(0); setSampleLabel(sampleQueries[0].name); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params]);

  const findings = useMemo(() => result ? [...result.sql.findings, ...(result.plan?.findings ?? [])] : [], [result]);
  const prioritizedFindings = useMemo(() => [...findings].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - ({ high: 0, medium: 1, low: 2 }[b.severity]))), [findings]);
  const riskCounts = useMemo(() => ({ high: findings.filter(item => item.severity === "high").length, medium: findings.filter(item => item.severity === "medium").length, low: findings.filter(item => item.severity === "low").length }), [findings]);
  const hasPlan = Boolean(plan.trim());
  const candidateChecked = Boolean(result?.candidateSql && candidateSql.trim() === checkedCandidate);

  async function analyze() {
    if (!sql.trim() || busy) return;
    setBusy(true); setError(""); setSaved(false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), includeAI ? 20000 : 10000);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sql, candidateSql: candidateSql.trim() || undefined, plan: plan.trim() || undefined, candidatePlan: candidatePlan.trim() || undefined, schema: schema.trim() || undefined, includeAI, accessCode: includeAI ? accessCode : undefined }), signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Analysis failed.");
      setResult(body as ResponseData);
      setCheckedCandidate(candidateSql.trim());
      const checkedRevision = Boolean(candidateSql.trim() && (body as ResponseData).candidateSql);
      if (checkedRevision) setShowCandidateEditor(false);
      requestAnimationFrame(() => document.getElementById(checkedRevision ? "candidate-workspace" : "report")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Analysis failed."); }
    finally { clearTimeout(timer); setBusy(false); }
  }

  function loadSample() {
    const nextIndex = (sampleIndex + 1) % sampleQueries.length;
    const sample = sampleQueries[nextIndex];
    setSampleIndex(nextIndex);
    setSampleLabel(sample.name);
    setSql(sample.sql);
    setCandidateSql("");
    setShowCandidateEditor(false);
    setCheckedCandidate("");
    setPlan(nextIndex === 0 ? demoPlan : "");
    setCandidatePlan("");
    setResult(null);
    setError("");
    setDemo(nextIndex === 0);
    setSaved(false);
  }

  function useWorkloadQuery(query: string) {
    setSql(query);
    setCandidateSql("");
    setShowCandidateEditor(false);
    setCheckedCandidate("");
    setPlan("");
    setCandidatePlan("");
    setResult(null);
    setError("");
    setDemo(false);
    setSampleLabel("");
    requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("textarea[aria-label='SQL query']")?.focus());
  }

  function save() {
    if (!result) return;
    const id = crypto.randomUUID();
    try {
      saveAnalysis({ id, title: result.sql.tables.length ? result.sql.tables.join(" + ") : "SQL analysis", sql, candidateSql: candidateSql.trim() || undefined, plan: plan.trim() || undefined, candidatePlan: candidatePlan.trim() || undefined, savedAt: new Date().toISOString(), findingCount: findings.length, findings });
      setSaved(true);
    } catch { setError("Browser storage is full or unavailable. Export this report instead."); }
  }

  function exportReport() {
    if (!result) return;
    const lines = ["# QuerySense analysis", "", `Mode: ${result.plan?.kind === "measured" ? "Measured plan" : result.plan ? "Estimated plan" : "Static SQL"}`, `Analyzed: ${result.analyzedAt}`, ...(demo ? ["Illustrative example: plan numbers are fixtures, not a real database measurement."] : []), "", "## SQL", "", "```sql", sql, "```", "", "## Findings", "", ...findings.flatMap((item, i) => [`### ${i + 1}. ${item.title}`, "", `Evidence: ${item.evidence}`, "", item.explanation, "", `Action: ${item.action}`, "", `Verify: ${item.verify}`, ""]), "## Limits", "", ...result.sql.limitations.map(item => `- ${item}`)];
    if (result.candidateSql) lines.push("", "## Candidate SQL", "", "```sql", candidateSql, "```", "", "Candidate syntax was parsed; result equivalence and plan provenance were not verified.");
    if (result.plan) {
      lines.push("", "## Pasted plan", "", `Type: ${result.plan.kind}; nodes: ${result.plan.nodeCount}`);
      if (result.plan.executionTimeMs !== undefined) lines.push(`Execution time in pasted plan: ${result.plan.executionTimeMs} ms (not measured by QuerySense).`);
    }
    if (result.comparison) lines.push("", "## Experiment replay", "", `Comparison: ${result.comparison.metric}`, ...(result.comparison.before !== undefined ? [`Baseline: ${result.comparison.before} ${result.comparison.unit}`] : []), ...(result.comparison.after !== undefined ? [`Candidate: ${result.comparison.after} ${result.comparison.unit}`] : []), result.comparison.interpretation);
    if (result.ai?.hypotheses.length) lines.push("", "## AI hypotheses", "", ...result.ai.hypotheses.flatMap(item => [`### ${item.title}`, `Evidence ID: ${item.evidenceId}`, item.rationale, `Experiment: ${item.experiment}`, `Caveat: ${item.caveat}`, ""]));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown" }));
    const link = document.createElement("a"); link.href = url; link.download = "querysense-report.md"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyExplain() {
    await navigator.clipboard.writeText(`EXPLAIN (FORMAT JSON) ${sql.trim()}`);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  async function copyCandidate() {
    try {
      await navigator.clipboard.writeText(candidateSql.trim());
      setCandidateCopied(true);
      setTimeout(() => setCandidateCopied(false), 1800);
    } catch { setError("Clipboard access was unavailable. Select and copy the candidate SQL manually."); }
  }

  function startOptimization() {
    if (!candidateSql.trim()) setCandidateSql(sql);
    setShowCandidateEditor(true);
    requestAnimationFrame(() => {
      const editor = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Optimized query draft"]');
      editor?.scrollIntoView({ behavior: "smooth", block: "center" });
      editor?.focus({ preventScroll: true });
    });
  }

  function openPlanInput() {
    const details = document.getElementById("plan-evidence") as HTMLDetailsElement | null;
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ behavior: "smooth", block: "center" });
    details.querySelector("textarea")?.focus({ preventScroll: true });
  }

  return <div className="app-shell">
    <Nav />
    <main className="workbench">
      <section className="workbench-intro">
        <div><span className="eyebrow accent-line">THE QUERY LAB / 01</span><h1>Know <em>why</em> a query is slow.</h1><p>Inspect the SQL. Bring the plan. Leave with a testable next move.</p></div>
        <div className="session-stamp"><span>POSTGRESQL</span><strong>READ-ONLY<br/>ANALYSIS</strong><span>NO DATABASE CONNECTION</span></div>
      </section>

      <WorkloadExplorer onUseQuery={useWorkloadQuery}/>

      <div className="workbench-grid">
        <section className="input-column" aria-label="Analysis inputs">
          <div className="section-label"><span>01 / INPUT</span><span>YOUR QUERY</span></div>
          <div className="editor-panel">
            <div className="editor-title"><div className="editor-tabs"><span className="tab-active"><FileCode2 size={15}/> query.sql</span></div><span className="editor-meta">POSTGRESQL · SELECT</span></div>
            <div className="editor-body"><div className="line-rail" aria-hidden="true">{Array.from({ length: Math.max(10, sql.split("\n").length) }, (_, i) => <span key={i}>{i + 1}</span>)}</div><textarea aria-label="SQL query" spellCheck={false} value={sql} onChange={event => { setSql(event.target.value); setResult(null); setSaved(false); setSampleLabel(""); setCheckedCandidate(""); setPlan(""); setCandidatePlan(""); setShowCandidateEditor(false); setDemo(false); }} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); analyze(); } if (event.key === "Tab") { event.preventDefault(); const target = event.currentTarget; const start = target.selectionStart; const end = target.selectionEnd; const next = sql.slice(0, start) + "  " + sql.slice(end); setSql(next); requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + 2; }); } }} placeholder="-- Paste a PostgreSQL SELECT query here…" maxLength={20000}/></div>
            <div className="editor-footer"><span>{sql.length.toLocaleString()} / 20,000 characters</span><span>⌘ / Ctrl + Enter to analyze</span></div>
          </div>
          <div className="input-actions"><button className="text-button sample-button" onClick={loadSample}><FlaskConical size={16}/>{sampleLabel ? `Load next sample (${(sampleIndex + 1) % sampleQueries.length + 1}/5)` : "Load sample query (1/5)"}</button><button className="text-button" disabled={!sql.trim()} onClick={copyExplain}><Clipboard size={16}/>{copied ? "Copied" : "Copy EXPLAIN command"}</button></div>
          {sampleLabel && <p className="demo-note"><Info size={14}/>{sampleLabel}{demo ? " · sample plan is illustrative, with fixture values." : " · no plan is attached; add one from your PostgreSQL database for plan evidence."}</p>}

          <div className="section-label second-label"><span>02 / EVIDENCE</span><span>OPTIONAL, BUT POWERFUL</span></div>
          <details id="plan-evidence" className="evidence-panel" open={hasPlan}>
            <summary><div><Layers3 size={18}/><strong>PostgreSQL execution plan</strong><span className="optional-tag">JSON</span></div><ArrowDown size={16}/></summary>
            <div className="evidence-content"><p>Run <code>EXPLAIN (FORMAT JSON)</code> in your own database client and paste the JSON below. For actual time and buffer evidence, use <code>EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)</code> only on a safe, representative environment; ANALYZE executes the query.</p><textarea aria-label="PostgreSQL EXPLAIN JSON plan" value={plan} onChange={event => { setPlan(event.target.value); setResult(null); setDemo(false); }} placeholder='[{"Plan":{"Node Type":"Seq Scan", ...}}]' maxLength={180000}/><span className="field-hint">Plans are processed for this request only. Avoid pasting sensitive literals.</span></div>
          </details>
          <details className="evidence-panel">
            <summary><div><FlaskConical size={18}/><strong>Candidate experiment</strong><span className="optional-tag">EXPERIMENT</span></div><ArrowDown size={16}/></summary>
            <div className="evidence-content"><p>After the baseline analysis, enter a candidate SQL query in the comparison panel below. Paste its JSON plan here when you have one. QuerySense cannot prove that the candidate returns equivalent results or that a plan came from that SQL.</p><label className="field-label" htmlFor="candidate-plan">Candidate PostgreSQL EXPLAIN JSON plan (optional)</label><textarea id="candidate-plan" value={candidatePlan} onChange={event => { setCandidatePlan(event.target.value); setResult(null); setSaved(false); }} placeholder='[{"Plan":{"Node Type":"Index Scan", ...}}]' maxLength={180000}/><span className="field-hint">Compare result sets and run several comparable trials on representative data before deploying.</span></div>
          </details>
          <details className="evidence-panel">
            <summary><div><Sparkles size={18}/><strong>AI hypothesis review</strong><span className="optional-tag">OPT IN</span></div><ArrowDown size={16}/></summary>
            <div className="evidence-content"><p>AI can propose experiments tied to findings. It does not invent timings or apply rewrites. Enabling this sends your SQL, optional schema, and plan summary to the configured AI provider.</p><label className="check-row"><input type="checkbox" checked={includeAI} onChange={event => setIncludeAI(event.target.checked)}/> Request AI review</label>{includeAI && <><label className="field-label" htmlFor="access-code">Demo access code</label><input id="access-code" className="text-input" type="password" autoComplete="off" value={accessCode} onChange={event => setAccessCode(event.target.value)} placeholder="Provided by site owner"/><label className="field-label" htmlFor="schema-context">Schema context for AI (optional)</label><textarea id="schema-context" className="schema-input" value={schema} onChange={event => setSchema(event.target.value)} placeholder="CREATE TABLE ..." maxLength={10000}/></>}<span className="field-hint">No AI call occurs unless you explicitly enable it.</span></div>
          </details>
          <div className="submit-row"><div><LockKeyhole size={15}/><span>We never run your SQL or save it on our server.</span></div><button className="primary-button" disabled={!sql.trim() || busy} onClick={analyze}>{busy ? <><LoaderCircle className="spin" size={17}/> Analyzing</> : <>Analyze query <ArrowRight size={17}/></>}</button></div>
          {error && !result && <div className="error-box" role="alert"><strong>Couldn’t analyze this input.</strong><span>{error}</span></div>}
        </section>

        <aside className="guide-column" aria-label="Analysis guide"><div className="guide-card"><span className="eyebrow">THE EVIDENCE LADDER</span><h2>From intuition<br/>to <em>proof.</em></h2><div className="ladder-item"><span>01</span><div><strong>SQL structure</strong><p>Parser-backed clues. No performance claims.</p></div></div><div className="ladder-item"><span>02</span><div><strong>PostgreSQL plan</strong><p>See scans, row estimates, and actuals when provided.</p></div></div><div className="ladder-item"><span>03</span><div><strong>Run an experiment</strong><p>Change one thing; compare plans and results on representative data.</p></div></div><div className="guide-bottom">A suggestion is a hypothesis until your database confirms it. <ArrowRight size={16}/></div></div><div className="guide-aside"><span className="eyebrow">WHY THIS EXISTS</span><p>Generic AI cannot see your planner. QuerySense organizes observable evidence and gives you a repeatable verification loop.</p></div></aside>
      </div>

        {result && <section id="report" className="report-section"><div className="report-heading"><div><span className="eyebrow accent-line">THE READOUT / 02</span><h2>Your query, under the lens.</h2><p>{demo ? "Illustrative demo fixture" : result.plan?.kind === "measured" ? "Measured plan supplied by you" : result.plan ? "Planner estimates supplied by you" : "Static SQL inspection"} · {result.sql.statement}</p></div><div className="report-actions"><button className="optimize-button" onClick={startOptimization}><Zap size={17} aria-hidden="true"/> Build optimized draft</button><button className="secondary-button" onClick={save} disabled={saved}>{saved ? <Check size={16}/> : <BookmarkPlus size={16}/>} {saved ? "Inputs saved" : "Save inputs locally"}</button><button className="secondary-button" onClick={exportReport}><Download size={16}/> Export report</button></div></div>
        {demo && <div className="demo-note report-demo"><Info size={15}/> This report uses fabricated example plan numbers to demonstrate the interface.</div>}
        {error && <div className="error-box" role="alert">{error}</div>}
        <div className="analysis-overview">
          <StructureScore findings={result.sql.findings}/>
          <div className="analysis-insights">
            <section className="risk-profile" aria-label="Detected signals by severity"><div className="insight-heading"><TriangleAlert size={17}/><strong>Signals to review</strong><span>{findings.length}</span></div>{(["high", "medium", "low"] as const).map(level => { const count = riskCounts[level]; const width = findings.length ? count / findings.length * 100 : 0; return <div className="risk-row" key={level}><span className={`risk-dot risk-${level}`}/><span className="risk-name">{level}</span><div className="risk-track"><i className={`risk-fill risk-fill-${level}`} style={{ width: `${width}%` }}/></div><strong>{count}</strong></div>; })}<p>Signals combine SQL rules and plan evidence when a plan is provided.</p></section>
            <section className="next-action-card"><span className="eyebrow">{prioritizedFindings[0] ? "BEST PLACE TO START" : "NEXT STEP"}</span><h3>{prioritizedFindings[0]?.title ?? "Add a PostgreSQL plan"}</h3><p>{prioritizedFindings[0]?.action ?? "No configured SQL patterns were found. Paste a plan from your database to inspect its actual access path and row estimates."}</p>{prioritizedFindings[0] && <a href="#risk-findings">See evidence <ArrowRight size={14}/></a>}</section>
          </div>
        </div>
        <PlanMetrics plan={result.plan} demo={demo} onAddPlan={openPlanInput}/>
        <section id="candidate-workspace" className={`candidate-workspace${!candidateSql.trim() ? " candidate-workspace-idle" : ""}`} aria-label="Query revision workspace">
          <div className="candidate-workspace-heading"><div><span className="eyebrow">QUERY REVISION / 03</span><h3>{candidateChecked ? "Before → after" : "Optimized query draft"}</h3></div><span className="optional-tag">{candidateChecked ? "SYNTAX CHECKED" : "YOUR EDIT"}</span></div>
          {!candidateSql.trim() && <div className="candidate-empty"><FileCode2 size={20} aria-hidden="true"/><span>Start from your query, make one change, then compare.</span><button className="secondary-button" onClick={startOptimization}>Open draft <ArrowRight size={15}/></button></div>}
          {candidateChecked && <motion.section className="before-after-panel" aria-label="SQL before and after candidate comparison" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}><div className="before-after-heading"><span className="eyebrow">ORIGINAL <ArrowRight size={13} aria-hidden="true"/> CANDIDATE</span><div className="candidate-diff-actions"><button className="secondary-button copy-candidate" onClick={() => setShowCandidateEditor(value => !value)}>{showCandidateEditor ? "Hide editor" : "Edit SQL"}</button><button className="secondary-button copy-candidate" onClick={copyCandidate}><Clipboard size={15}/>{candidateCopied ? "Copied" : "Copy SQL"}</button></div></div><DiffViewer oldValue={sql} newValue={candidateSql} splitView/></motion.section>}
          {candidateSql.trim() && (!candidateChecked || showCandidateEditor) && <div className="candidate-edit-area"><details className="candidate-source"><summary>View original SQL</summary><pre>{sql}</pre></details><div className="query-version candidate-version"><strong><span className="version-mark candidate-mark"/>Candidate SQL</strong><textarea aria-label="Optimized query draft" spellCheck={false} value={candidateSql} onChange={event => { setCandidateSql(event.target.value); setCandidatePlan(""); setSaved(false); }} placeholder="Make a targeted change based on the findings." maxLength={20000}/></div><div className="candidate-actions"><span>{candidateSql.trim() === sql.trim() ? "Edit the copied query to test a change." : "Not checked yet."}</span><div className="candidate-action-buttons"><button className="secondary-button" onClick={() => { setCandidateSql(sql); setCandidatePlan(""); setCheckedCandidate(""); setSaved(false); }}>Reset draft</button><button className="primary-button" disabled={!candidateSql.trim() || candidateSql.trim() === sql.trim() || busy} onClick={analyze}>{busy ? <><LoaderCircle className="spin" size={16}/> Checking</> : <>Check candidate <ArrowRight size={16}/></>}</button></div></div></div>}
          {candidateChecked && <div className="candidate-review-note"><Check size={15} aria-hidden="true"/><span>Syntax checked</span><i aria-hidden="true"/><span>Compare results and plans on your database before using this SQL.</span></div>}
        </section>
        {result.comparison && <div className="comparison-card"><div><span className="eyebrow">PLAN EXPERIMENT / {result.comparison.metric.toUpperCase()}</span><h3>{result.comparison.metric === "unavailable" ? "No comparable metric" : `${result.comparison.before} → ${result.comparison.after} ${result.comparison.unit}`}</h3>{result.comparison.changePercent !== undefined && <strong>{result.comparison.changePercent > 0 ? "+" : ""}{result.comparison.changePercent.toFixed(1)}% change in the pasted plans</strong>}</div><p>{result.comparison.interpretation}</p></div>}
        <div id="risk-findings" className="section-label findings-heading"><span>RISK FINDINGS / {String(findings.length).padStart(2, "0")}</span><span>PRIORITIZED BY SEVERITY</span></div>
        {prioritizedFindings.length ? <div className="findings-grid">{prioritizedFindings.map((finding, i) => <FindingCard key={`${finding.id}-${i}`} finding={finding} index={i}/>)}</div> : <div className="empty-readout"><Check size={26}/><h3>No configured patterns were flagged.</h3><p>This is not a performance or safety guarantee. Add a PostgreSQL plan to see how the database handles this query on your data.</p></div>}
        {result.plan && <div className="plan-section"><div className="section-label"><span>03 / PLAN TRACE</span><span>{result.plan.kind === "measured" ? "ACTUALS AVAILABLE" : "ESTIMATES ONLY"}</span></div><div className="plan-panel"><div className="plan-panel-head"><TerminalSquare size={18}/><div><strong>Planner path</strong><p>Indented nodes show how the database built the result. Node time is inclusive of child work.</p></div></div><PlanBranch node={result.plan.root}/></div></div>}
        {includeAI && <div className="ai-section"><div className="section-label"><span>04 / AI REVIEW</span><span>HYPOTHESES, NOT PROOF</span></div>{result.aiStatus === "unavailable" ? <div className="empty-readout"><h3>AI review unavailable.</h3><p>The deterministic report is complete. Check provider configuration or try later.</p></div> : result.aiStatus === "context_limit" ? <div className="empty-readout"><h3>AI context limit reached.</h3><p>The deterministic report is complete. For AI review, use at most 8,000 SQL characters, 3,000 schema characters, and 60,000 baseline plan characters.</p></div> : result.ai?.hypotheses.length ? <div className="ai-grid">{result.ai.hypotheses.map((item, i) => <article className="ai-card" key={i}><span className="eyebrow">HYPOTHESIS {String(i + 1).padStart(2, "0")} · {item.evidenceId}</span><h3>{item.title}</h3><p>{item.rationale}</p><div><strong>Test</strong><p>{item.experiment}</p><strong>Caveat</strong><p>{item.caveat}</p></div></article>)}</div> : <div className="empty-readout"><h3>No additional AI hypothesis.</h3><p>That is a valid result when the supplied evidence does not support a specific next move.</p></div>}</div>}
        <div className="report-limit"><Info size={18}/><p>QuerySense never executes SQL. Cost units are planner estimates, not milliseconds. Verify every change on representative data and compare result sets before deployment.</p></div>
      </section>}
    </main>
    <footer className="site-footer"><span>QUERY<span>SENSE</span> / LAB</span><p>Evidence first. Faster queries, earned.</p><span>© {new Date().getFullYear()}</span></footer>
  </div>;
}

export default function EditorPage() { return <Suspense fallback={<div className="app-shell"><Nav/><main className="workbench"><p>Loading workbench…</p></main></div>}><EditorContent/></Suspense>; }
