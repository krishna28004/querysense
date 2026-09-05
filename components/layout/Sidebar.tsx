"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  {
    label: "Analyze",
    href: "/editor",
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

interface SidebarProps {
  isMobile?: boolean;
  mobileOpen?: boolean;
  desktopCollapsed?: boolean;
  onToggle?: () => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({ 
  isMobile = false, 
  mobileOpen = false, 
  desktopCollapsed = false,
  onToggle,
  onCloseMobile
}: SidebarProps) {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/share")) {
    return null;
  }

  // Determine actual state based on device
  const isOpen = isMobile ? mobileOpen : true;
  const isCollapsed = !isMobile && desktopCollapsed;

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0
        w-[var(--qs-sidebar-width)]
        bg-[var(--qs-bg-secondary)]
        border-r border-[var(--qs-border)]
        flex flex-col
        z-40
        transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className={`p-5 pb-6 border-b border-[var(--qs-border)] flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div
              className="
                w-9 h-9 rounded-[var(--qs-radius-md)]
                bg-[var(--qs-accent)]
                flex items-center justify-center
                transition-shadow duration-300
              "
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-base font-bold text-[var(--qs-text-primary)] leading-tight">
                Query<span className="qs-text-gradient">Sense</span>
              </h1>
              <p className="text-[10px] text-[var(--qs-text-muted)] font-medium tracking-wider uppercase">
                SQL Optimizer
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href} className="relative group">
              <Link href={item.href}>
                <motion.div
                  whileHover={{ x: isCollapsed ? 0 : 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5
                    rounded-[var(--qs-radius-md)]
                    text-sm font-medium
                    transition-colors duration-200
                    ${isCollapsed ? 'justify-center' : ''}
                    ${
                      isActive
                        ? "bg-[var(--qs-accent-subtle)] text-white"
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
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </motion.div>
              </Link>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[var(--qs-bg-elevated)] border border-[var(--qs-border)] rounded-[var(--qs-radius-sm)] shadow-[var(--qs-shadow-md)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-[var(--qs-text-primary)] whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-[var(--qs-border)] flex flex-col gap-2">
        {/* Status Indicator */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 px-3 py-2'}`}>
          <div className="w-2 h-2 rounded-full bg-[var(--qs-success)] animate-pulse flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xs text-[var(--qs-text-muted)] whitespace-nowrap">
              AI Engine Online
            </span>
          )}
        </div>
        
        {/* Toggle Button */}
        {!isMobile && onToggle && (
          <button 
            onClick={onToggle}
            className={`
              flex items-center text-sm font-medium text-[var(--qs-text-muted)] hover:text-[var(--qs-text-primary)] hover:bg-[var(--qs-bg-card)]
              px-3 py-2 rounded-[var(--qs-radius-md)] transition-colors
              ${isCollapsed ? 'justify-center' : 'gap-3'}
            `}
          >
            {isCollapsed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            )}
            {!isCollapsed && <span className="whitespace-nowrap">Collapse</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
