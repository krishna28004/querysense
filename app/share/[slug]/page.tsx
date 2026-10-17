import Link from "next/link";
import Nav from "@/components/workbench/Nav";
export default function RetiredSharePage() { return <div className="app-shell"><Nav/><main className="simple-page"><span className="eyebrow">SHARING RETIRED</span><h1>This public report is no longer available.</h1><p className="lede">QuerySense retired anonymous public links to protect SQL that may contain sensitive application details. Reports can now be exported from the workbench by their owner.</p><Link className="primary-button" href="/editor">Open workbench</Link></main></div>; }
