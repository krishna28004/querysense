"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  {
    label: "Analyze",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    label: "History",
    href: "/history",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: "About",
    href: "/about",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed left-0 top-0 bottom-0
        w-[var(--qs-sidebar-width)]
        bg-[var(--qs-bg-secondary)]
        border-r border-[var(--qs-border)]
        flex flex-col
        z-40
      "
    >
      {/* Logo */}
      <div className="p-5 pb-6 border-b border-[var(--qs-border)]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div
              className="
                w-9 h-9 rounded-[var(--qs-radius-md)]
                bg-[var(--qs-accent)]
                flex items-center justify-center
                shadow-[var(--qs-shadow-glow)]
                group-hover:shadow-[0_0_24px_rgba(99,102,241,0.4)]
                transition-shadow duration-300
              "
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--qs-text-primary)] leading-tight">
              Query<span className="qs-text-gradient">Sense</span>
            </h1>
            <p className="text-[10px] text-[var(--qs-text-muted)] font-medium tracking-wider uppercase">
              SQL Optimizer
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5
                  rounded-[var(--qs-radius-md)]
                  text-sm font-medium
                  transition-colors duration-200
                  ${
                    isActive
                      ? "bg-[var(--qs-accent-subtle)] text-[var(--qs-accent-hover)]"
                      : "text-[var(--qs-text-secondary)] hover:text-[var(--qs-text-primary)] hover:bg-[var(--qs-bg-card)]"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--qs-accent)]"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <span className="flex-shrink-0">{item.icon}</span>
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[var(--qs-border)]">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[var(--qs-success)] animate-pulse" />
          <span className="text-xs text-[var(--qs-text-muted)]">
            AI Engine Online
          </span>
        </div>
      </div>
    </aside>
  );
}
