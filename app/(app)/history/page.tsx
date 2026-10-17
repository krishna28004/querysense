"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import Nav from "@/components/workbench/Nav";
import { deleteAnalysis, loadHistory, type SavedAnalysis } from "@/lib/local-history";

export default function HistoryPage() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => setItems(loadHistory()), 0); return () => window.clearTimeout(timer); }, []);
  function remove(id: string) { deleteAnalysis(id); setItems(loadHistory()); setPendingDelete(null); }
  return <div className="app-shell"><Nav/><main className="simple-page"><span className="eyebrow accent-line">YOUR DESK / SAVED WORK</span><h1>Notes from the lab.</h1><p className="lede">Queries and plans you chose to save live only in this browser. Open one to run a fresh analysis. They are not synced or published.</p>{items.length ? <div className="history-list">{items.map(item => <article className="history-row" key={item.id}><div><strong>{item.title}</strong><p>{item.sql}</p><small>{new Date(item.savedAt).toLocaleString()} · {item.findingCount} findings last time{item.plan ? " · plan saved" : ""}</small></div><div className="history-controls"><Link href={`/editor?from=${encodeURIComponent(item.id)}`}>Open <ArrowRight size={13}/></Link>{pendingDelete === item.id ? <><button onClick={() => remove(item.id)}>Confirm delete</button><button onClick={() => setPendingDelete(null)}>Cancel</button></> : <button aria-label={`Delete saved analysis ${item.title}`} onClick={() => setPendingDelete(item.id)}><Trash2 size={15}/></button>}</div></article>)}</div> : <div className="empty-readout" style={{ marginTop: 40 }}><h3>No saved work yet.</h3><p>Analyze a query and choose “Save inputs locally” to return to it here.</p><Link className="primary-button" href="/editor" style={{ marginTop: 25 }}>Open workbench <ArrowRight size={16}/></Link></div>}</main><footer className="site-footer"><span>QUERY<span>SENSE</span> / LAB</span><p>Your saved work stays in this browser.</p><span>© {new Date().getFullYear()}</span></footer></div>;
}
