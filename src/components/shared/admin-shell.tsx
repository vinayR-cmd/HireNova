"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { AiAssistantWidget } from "./ai-assistant-widget";

interface AdminShellProps {
  user: { fullName: string; email: string; role: string };
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync with localStorage so main content area doesn't flash on refresh
  useEffect(() => {
    const saved = localStorage.getItem("recruitiq_sidebar_collapsed");
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#08090C] text-white antialiased flex relative">
      <div className="fixed top-0 right-0 w-[36rem] h-[36rem] rounded-full bg-[oklch(0.62_0.21_291)]/[0.05] blur-3xl pointer-events-none -z-0 -translate-y-1/3 translate-x-1/4" />
      <Sidebar
        role="ADMIN"
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onCollapseChange={setSidebarCollapsed}
      />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}
      >
        <Header user={user} onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
      <AiAssistantWidget />
    </div>
  );
}
