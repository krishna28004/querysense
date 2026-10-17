"use client";

import { useMemo, useRef, useState } from "react";
import { BarChart3, FileUp, Info, Search, X } from "lucide-react";
import { parseWorkloadCsv, rankWorkload, type WorkloadMetric, type WorkloadReport } from "@/lib/workload";

const exampleCsv = `queryid,query,calls,total_exec_time,mean_exec_time,shared_blks_read
101,"SELECT * FROM orders WHERE status = $1",18000,94600,5.25,120450
202,"SELECT id, email FROM users WHERE email = $1",420,31700,75.48,18300
303,"SELECT count(*) FROM events WHERE account_id = $1",9400,58000,6.17,245000
404,"SELECT id FROM sessions WHERE token = $1",72000,36000,0.5,1800`;

const metrics: { value: WorkloadMetric; label: string; unit: string }[] = [
  { value: "total_exec_time", label: "Total time", unit: "ms total" },
  { value: "mean_exec_time", label: "Mean time", unit: "ms / call" },
  { value: "calls", label: "Call volume", unit: "calls" },
  { value: "shared_blks_read", label: "Shared reads", unit: "shared blocks" },
];

function formatValue(row: WorkloadReport["rows"][number], metric: WorkloadMetric) {
  const raw = metric === "total_exec_time" ? row.totalExecTimeMs : metric === "mean_exec_time" ? row.meanExecTimeMs : metric === "calls" ? row.calls : row.sharedBlocksRead;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: metric === "mean_exec_time" ? 2 : 0 }).format(raw);
}

export default function WorkloadExplorer({ onUseQuery }: { onUseQuery: (query: string) => void }) {
  const [report, setReport] = useState<WorkloadReport | null>(null);
  const [metric, setMetric] = useState<WorkloadMetric>("total_exec_time");
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");
  const [filter, setFilter] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const ordered = useMemo(() => {
    if (!report) return [];
    const needle = filter.trim().toLowerCase();
    return rankWorkload(report.rows, metric).filter(row => !needle || row.query.toLowerCase().includes(needle) || row.queryId.toLowerCase().includes(needle)).slice(0, 100);
  }, [report, metric, filter]);
  const maxValue = ordered.length ? Math.max(...ordered.map(row => metric === "total_exec_time" ? row.totalExecTimeMs : metric === "mean_exec_time" ? row.meanExecTimeMs : metric === "calls" ? row.calls : row.sharedBlocksRead), 1) : 1;

  async function loadFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      const parsed = parseWorkloadCsv(await file.text());
      setReport(parsed);
      setFilename(file.name);
    } catch (cause) {
      setReport(null);
      setFilename("");
      setError(cause instanceof Error ? cause.message : "Could not read this CSV.");
    }
  }

  function loadExample() {
    try { setReport(parseWorkloadCsv(exampleCsv)); setFilename("illustrative sample"); setError(""); }
    catch { setError("The built-in example could not be loaded."); }
  }

  return <details className="evidence-panel workload-panel">
    <summary><div><BarChart3 size={18}/><strong>Find the queries that matter</strong><span className="optional-tag">LOCAL CSV</span></div><span className="workload-summary-hint">Workload triage</span></summary>
    <div className="evidence-content">
      <p>Import a PostgreSQL <code>pg_stat_statements</code> CSV to rank query shapes by aggregate impact. The file is read in your browser only; it is not uploaded or saved.</p>
      {!report ? <div className="workload-import-actions">
        <input ref={input} className="visually-hidden-input" type="file" accept=".csv,text/csv" aria-label="Choose pg_stat_statements CSV" onChange={event => { void loadFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}/>
        <button className="secondary-button" type="button" onClick={() => input.current?.click()}><FileUp size={15}/> Import CSV</button>
        <button className="text-button" type="button" onClick={loadExample}>Explore sample workload</button>
      </div> : <>
        <div className="workload-summary"><div><span>QUERY SHAPES</span><strong>{report.rows.length.toLocaleString()}</strong></div><div><span>TOTAL CALLS</span><strong>{report.totalCalls.toLocaleString()}</strong></div><div><span>AGGREGATE TIME</span><strong>{report.totalExecTimeMs.toLocaleString(undefined, { maximumFractionDigits: 0 })} ms</strong></div><button type="button" className="icon-button" aria-label="Clear workload" onClick={() => { setReport(null); setFilename(""); setFilter(""); }}><X size={16}/></button></div>
        <div className="workload-toolbar"><label><span className="visually-hidden">Rank by</span><select value={metric} onChange={event => setMetric(event.target.value as WorkloadMetric)}>{metrics.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="workload-search"><Search size={14}/><span className="visually-hidden">Filter query text</span><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Filter query text"/></label></div>
        <p className="workload-fileline">{filename} · showing top {ordered.length} of {report.rows.length.toLocaleString()} imported rows · ranked by {metrics.find(item => item.value === metric)?.label.toLowerCase()}</p>
        {ordered.length ? <ol className="workload-list">{ordered.map((row, index) => {
          const value = metric === "total_exec_time" ? row.totalExecTimeMs : metric === "mean_exec_time" ? row.meanExecTimeMs : metric === "calls" ? row.calls : row.sharedBlocksRead;
          return <li key={`${row.queryId}-${index}`}><div className="workload-row-head"><span className="workload-rank">{String(index + 1).padStart(2, "0")}</span><strong>{formatValue(row, metric)} <small>{metrics.find(item => item.value === metric)?.unit}</small></strong><button type="button" className="workload-use" onClick={() => onUseQuery(row.query)} disabled={!/^\s*(with\b[\s\S]*?\bselect\b|select\b)/i.test(row.query)}>Inspect SQL <span aria-hidden="true">↗</span></button></div><div className="workload-bar"><i style={{ width: `${Math.max(2, value / maxValue * 100)}%` }}/></div><pre>{row.query}</pre><div className="workload-row-meta"><span>{row.calls.toLocaleString()} calls</span><span>{row.meanExecTimeMs.toLocaleString(undefined, { maximumFractionDigits: 2 })} ms mean</span><span>{row.sharedBlocksRead.toLocaleString()} shared reads</span></div></li>;
        })}</ol> : <div className="workload-empty"><Search size={16}/>No imported query matches that filter.</div>}
        {report.warnings.map((warning, index) => <p className="workload-warning" key={index}><Info size={13}/>{warning}</p>)}
      </>}
      {error && <p className="workload-error" role="alert">{error}</p>}
      <p className="field-hint">This ranks imported aggregate statistics, not live queries. Reset the statistics window and compare equal windows before treating changes as regressions. Query text can contain sensitive literals; sanitize exports first.</p>
      {!report && <p className="field-hint">Expected columns include <code>query</code>, <code>calls</code>, and <code>total_exec_time</code> (or legacy <code>total_time</code> / <code>mean_exec_time</code>).</p>}
    </div>
  </details>;
}
