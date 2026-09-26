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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fe" }}>
      {/* Overlay mobile — menutup drawer saat diklik */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area — margin sidebar hanya di desktop */}
      <div
        className={clsx(
          "flex flex-col min-h-screen transition-all duration-300 ml-0",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <Topbar
          onMenuToggle={() => setMobileOpen(true)}
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 p-4 sm:p-6">{children}</main>

        <footer className="px-4 sm:px-6 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Sistem Supervisi Guru — Pembelajaran Mendalam
        </footer>
      </div>
    </div>
  );
}
