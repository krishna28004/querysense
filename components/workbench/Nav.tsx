"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, DatabaseZap } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Nav() {
  const pathname = usePathname();
  return <header className="site-nav">
    <div className="nav-inner">
      <Link className="brand" href="/" aria-label="QuerySense home"><span className="brand-icon"><DatabaseZap size={20} strokeWidth={2.3}/></span><span>query<span className="brand-accent">sense</span><small> / LAB</small></span></Link>
      <nav aria-label="Main navigation" className="nav-links">
        <Link className={pathname === "/editor" ? "active" : ""} href="/editor">Workbench</Link>
        <Link className={pathname === "/history" ? "active" : ""} href="/history">Saved work</Link>
        <Link className={pathname === "/about" ? "active" : ""} href="/about">Method</Link>
        <Link className={pathname === "/settings" ? "active" : ""} href="/settings">Settings</Link>
      </nav>
      <div className="nav-tools"><ThemeToggle/><Link className="nav-cta" href="/editor">Open the lab <ArrowUpRight size={15}/></Link></div>
    </div>
  </header>;
}
