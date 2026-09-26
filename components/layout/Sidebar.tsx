"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  School,
  Users,
  ClipboardList,
  FileSearch,
  Eye,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  X,
  GraduationCap,
  BookOpen,
  Paperclip,
  ListChecks,
  CalendarClock,
} from "lucide-react";
import clsx from "clsx";
import { useSettings } from "@/lib/useSettings";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Utama",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "SUPERVISOR", "GURU"],
      },
    ],
  },
  {
    title: "Administrasi",
    items: [
      {
        label: "Kelola Sekolah",
        href: "/admin/sekolah",
        icon: School,
        roles: ["ADMIN"],
      },
      {
        label: "Kelola Pengguna",
        href: "/admin/users",
        icon: Users,
        roles: ["ADMIN"],
      },
      {
        label: "Instrumen Supervisi",
        href: "/admin/instrumen",
        icon: ListChecks,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "Supervisi",
    items: [
      {
        label: "Siklus Supervisi",
        href: "/supervisor/siklus",
        icon: ClipboardList,
        roles: ["SUPERVISOR", "ADMIN"],
      },
      {
        label: "Pra Observasi",
        href: "/supervisor/pra-observasi",
        icon: FileSearch,
        roles: ["SUPERVISOR", "ADMIN"],
      },
      {
        label: "Observasi Kelas",
        href: "/supervisor/observasi",
        icon: Eye,
        roles: ["SUPERVISOR", "ADMIN"],
      },
      {
        label: "Pasca Supervisi",
        href: "/supervisor/pasca",
        icon: CheckSquare,
        roles: ["SUPERVISOR", "ADMIN"],
      },
    ],
  },
  {
    title: "Guru",
    items: [
      {
        label: "Hasil Supervisi",
        href: "/guru/hasil",
        icon: BookOpen,
        roles: ["GURU", "ADMIN"],
      },
      {
        label: "Rencana Tindak Lanjut",
        href: "/guru/rtl",
        icon: GraduationCap,
        roles: ["GURU", "ADMIN"],
      },
      {
        label: "Bukti Tugas",
        href: "/guru/bukti",
        icon: Paperclip,
        roles: ["GURU", "ADMIN"],
      },
    ],
  },
  {
    title: "Laporan",
    items: [
      {
        label: "Rekap & Statistik",
        href: "/laporan",
        icon: BarChart3,
        roles: ["ADMIN", "SUPERVISOR"],
      },
    ],
  },
  {
    title: "Sistem",
    items: [
      {
        label: "Pengaturan",
        href: "/admin/settings",
        icon: Settings,
        roles: ["ADMIN"],
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const { settings } = useSettings();

  return (
    <aside
      className={clsx(
        "fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 shadow-xl w-64",
        // Mobile: drawer di luar layar kecuali dibuka
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: selalu terlihat, lebar tergantung collapsed
        "lg:translate-x-0",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}
      style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}
    >
      {/* Brand */}
      <div className={clsx(
        "flex items-center gap-3 border-b border-white/10 flex-shrink-0 pr-3",
        collapsed ? "lg:px-4 lg:py-5 lg:justify-center" : "px-4 lg:px-6 py-5"
      )}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
        >
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.appName} className="w-full h-full object-cover" />
          ) : (
            <ClipboardList className="w-5 h-5 text-white" />
          )}
        </div>
        {(
          <div className={clsx("min-w-0 flex-1", collapsed && "lg:hidden")}>
            <p className="text-white font-bold text-sm leading-tight truncate">{settings.appName}</p>
            <p className="text-white/50 text-xs truncate">{settings.appTagline}</p>
          </div>
        )}
        {/* Tombol tutup drawer (hanya mobile) */}
        <button
          onClick={onMobileClose}
          className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors lg:hidden flex-shrink-0"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Toggle collapse (hanya desktop) */}
      <button
        onClick={onToggle}
        className={clsx(
          "hidden lg:flex absolute -right-3 top-16 w-6 h-6 bg-argon-primary rounded-full items-center justify-center shadow-lg hover:bg-argon-primary-dark transition-colors z-50"
        )}
        aria-label={collapsed ? "Buka sidebar" : "Sembunyikan sidebar"}
      >
        <ChevronLeft
          className={clsx("w-3 h-3 text-white transition-transform", collapsed && "rotate-180")}
        />
      </button>

      {/* Tahun ajaran aktif */}
      <div className={clsx("px-4 lg:px-6 py-2.5 bg-white/5 border-b border-white/10", collapsed && "lg:hidden")}>
        <p className="text-white/40 text-xs flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          T.A {settings.tahunAjaran} · {settings.semester === "GANJIL" ? "Ganjil" : "Genap"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-2">
              <p className={clsx("px-4 lg:px-6 py-2 text-xs font-bold text-white/30 uppercase tracking-widest", collapsed && "lg:hidden")}>
                {section.title}
              </p>
              {collapsed && <div className="hidden lg:block my-2 border-t border-white/5" />}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={clsx(
                      "flex items-center gap-3 py-3 text-sm transition-all duration-200 relative group",
                      collapsed ? "lg:px-4 lg:justify-center px-6" : "px-4 lg:px-6",
                      isActive
                        ? "text-white bg-white/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-argon-primary rounded-r-full" />
                    )}
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={clsx("font-medium", collapsed && "lg:hidden")}>{item.label}</span>
                    {/* Tooltip saat collapsed di desktop */}
                    {collapsed && (
                      <span className="hidden lg:block absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User info bottom */}
      {session && (
        <div className={clsx(
          "border-t border-white/10 flex-shrink-0",
          collapsed ? "lg:p-3 lg:flex lg:justify-center p-4" : "p-4"
        )}>
          <div className={clsx("flex items-center gap-3", collapsed && "lg:justify-center")}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
            >
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className={clsx("min-w-0", collapsed && "lg:hidden")}>
              <p className="text-white text-xs font-semibold truncate">
                {session.user.name}
              </p>
              <p className="text-white/40 text-xs truncate">
                {session.user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
