"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import clsx from "clsx";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function DashboardLayout({
  children,
  pageTitle,
  breadcrumbs,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fe" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main content area */}
      <div
        className={clsx(
          "flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <Topbar
          onMenuToggle={() => setCollapsed(!collapsed)}
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 p-6">
          {children}
        </main>

        <footer className="px-6 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Sistem Supervisi Guru — Pembelajaran Mendalam
        </footer>
      </div>
    </div>
  );
}
