"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Bell, Search, ChevronDown, LogOut, User, Menu } from "lucide-react";
import clsx from "clsx";

interface TopbarProps {
  onMenuToggle?: () => void;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function Topbar({ onMenuToggle, pageTitle, breadcrumbs }: TopbarProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left: menu toggle + breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          {pageTitle && (
            <h1 className="text-gray-800 font-semibold text-base leading-tight">
              {pageTitle}
            </h1>
          )}
          {breadcrumbs && (
            <nav className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span>/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-argon-primary transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-600">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Right: search + notif + user */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari..."
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-36"
          />
        </div>

        {/* Notification */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
            >
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-gray-700 text-sm font-semibold leading-tight">
                {session?.user?.name}
              </p>
              <p className="text-gray-400 text-xs">{session?.user?.role}</p>
            </div>
            <ChevronDown className={clsx(
              "w-4 h-4 text-gray-400 transition-transform",
              dropdownOpen && "rotate-180"
            )} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">{session?.user?.name}</p>
                <p className="text-xs text-gray-400">{session?.user?.email}</p>
                {session?.user?.sekolahNama && (
                  <p className="text-xs text-gray-400 mt-0.5">{session.user.sekolahNama}</p>
                )}
              </div>
              <a
                href="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Profil Saya
              </a>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
