"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { usePathname } from "next/navigation";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Read initial state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('qs-sidebar-collapsed');
    if (savedState) {
      setDesktopSidebarCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showSidebar = pathname !== "/" && !pathname.startsWith("/share");

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      const newState = !desktopSidebarCollapsed;
      setDesktopSidebarCollapsed(newState);
      localStorage.setItem('qs-sidebar-collapsed', String(newState));
    }
  };

  const sidebarWidth = desktopSidebarCollapsed ? '72px' : '277px';
  // On mobile, the sidebar acts as an overlay so it doesn't push content
  const marginLeft = isMobile ? '0px' : (showSidebar ? sidebarWidth : '0px');

  return (
    <div className="flex-1 flex w-full" style={{ '--qs-sidebar-width': sidebarWidth } as React.CSSProperties}>
      <Sidebar 
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        desktopCollapsed={desktopSidebarCollapsed}
        onToggle={toggleSidebar}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <main 
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300`}
        style={{ marginLeft }}
      >
        <Header 
          toggleSidebar={(showSidebar && isMobile) ? toggleSidebar : undefined} 
          sidebarOpen={isMobile ? mobileSidebarOpen : !desktopSidebarCollapsed} 
        />
        <div className="flex-1 relative z-10">
          <div className="absolute inset-0 pointer-events-none z-[-1]">
            <div className="absolute inset-0 qs-bg-grid" />
            <div className="absolute inset-0 qs-bg-radial opacity-50" />
          </div>
          {children}
        </div>
        <Footer />
      </main>

      {/* Mobile overlay */}
      {showSidebar && isMobile && mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}
