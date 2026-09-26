"use client";

import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Search, ChevronDown, LogOut, User, Menu, CheckCheck, ClipboardList, Target, GraduationCap, Info } from "lucide-react";
import clsx from "clsx";

interface TopbarProps {
  onMenuToggle?: () => void;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

interface NotifItem {
  id: string;
  judul: string;
  pesan: string;
  tipe: string;
  link: string | null;
  dibaca: boolean;
  createdAt: string;
}

const tipeIcon: Record<string, React.ElementType> = {
  supervisi: ClipboardList,
  rtl: Target,
  sukses: GraduationCap,
  info: Info,
};

const tipeStyle: Record<string, string> = {
  supervisi: "bg-indigo-50 text-indigo-600",
  rtl: "bg-orange-50 text-orange-600",
  sukses: "bg-green-50 text-green-600",
  info: "bg-gray-100 text-gray-500",
};

const fmtWaktu = (t: string) => {
  const d = new Date(t);
  const selisih = Date.now() - d.getTime();
  const menit = Math.floor(selisih / 60000);
  if (menit < 1) return "Baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

export default function Topbar({ onMenuToggle, pageTitle, breadcrumbs }: TopbarProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifikasi, setNotifikasi] = useState<NotifItem[]>([]);
  const [belumDibaca, setBelumDibaca] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const muatNotifikasi = useCallback(async () => {
    try {
      const res = await fetch("/api/notifikasi");
      if (!res.ok) return;
      const json = await res.json();
      setNotifikasi(json.items ?? []);
      setBelumDibaca(json.belumDibaca ?? 0);
    } catch {
      // diam — notifikasi tidak kritis
    }
  }, []);

  // Muat saat pertama + polling tiap 60 detik HANYA saat tab aktif (hemat request server)
  useEffect(() => {
    muatNotifikasi();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        muatNotifikasi();
      }
    }, 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") muatNotifikasi();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [muatNotifikasi]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function onClickLuar(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", onClickLuar);
      return () => document.removeEventListener("mousedown", onClickLuar);
    }
  }, [notifOpen]);

  const tandaiSemua = async () => {
    try {
      await fetch("/api/notifikasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifikasi((prev) => prev.map((n) => ({ ...n, dibaca: true })));
      setBelumDibaca(0);
    } catch {
      // diam
    }
  };

  const klikNotifikasi = async (n: NotifItem) => {
    if (!n.dibaca) {
      setNotifikasi((prev) => prev.map((x) => (x.id === n.id ? { ...x, dibaca: true } : x)));
      setBelumDibaca((b) => Math.max(0, b - 1));
      fetch("/api/notifikasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }
    setNotifOpen(false);
    if (n.link) window.location.href = n.link;
  };

  return (
    <header className="bg-white shadow-sm px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left: menu toggle + breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onMenuToggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors lg:hidden flex-shrink-0"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          {pageTitle && (
            <h1 className="text-gray-800 font-semibold text-base sm:text-lg leading-tight truncate">
              {pageTitle}
            </h1>
          )}
          {breadcrumbs && (
            <nav className="hidden sm:flex items-center gap-1 text-xs text-gray-400 mt-0.5">
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
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari..."
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-36"
          />
        </div>

        {/* Notifikasi */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {belumDibaca > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {belumDibaca > 9 ? "9+" : belumDibaca}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">Notifikasi</p>
                {belumDibaca > 0 && (
                  <button
                    onClick={tandaiSemua}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifikasi.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Belum ada notifikasi</p>
                  </div>
                ) : (
                  notifikasi.map((n) => {
                    const Icon = tipeIcon[n.tipe] ?? Info;
                    return (
                      <button
                        key={n.id}
                        onClick={() => klikNotifikasi(n)}
                        className={clsx(
                          "w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50",
                          !n.dibaca && "bg-indigo-50/40"
                        )}
                      >
                        <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", tipeStyle[n.tipe] ?? tipeStyle.info)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={clsx("text-xs truncate", n.dibaca ? "text-gray-600 font-medium" : "text-gray-800 font-bold")}>
                              {n.judul}
                            </p>
                            {!n.dibaca && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.pesan}</p>
                          <p className="text-[10px] text-gray-300 mt-1">{fmtWaktu(n.createdAt)}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 sm:px-3 py-2 transition-colors"
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
