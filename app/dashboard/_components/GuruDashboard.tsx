"use client";

import { useCallback, useEffect, useState } from "react";
import { Session } from "next-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import Badge, { predikatBadge, BadgeVariant } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  CheckCircle,
  ClipboardList,
  Target,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Inbox,
  Calendar,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Link from "next/link";

interface DashboardData {
  role: string;
  stats: { totalSiklus: number; selesai: number; rtlBerjalan: number; rtlSelesai: number };
  nilaiTerakhir: number | null;
  latestInfo: { topik: string | null; mapel: string | null; kelas: string | null; tahunAjaran: string; semester: string } | null;
  radarData: { dimensi: string; nilai: number }[];
  trendData: { semester: string; nilai: number }[];
  komponenPra: { label: string; nilai: number }[];
  rtlList: { aspek: string; rencana: string; status: string; deadline: string | null }[];
}

const rtlStatus: Record<string, { variant: "success" | "warning" | "info"; label: string }> = {
  SELESAI: { variant: "success", label: "Selesai" },
  PROSES: { variant: "warning", label: "Proses" },
  BELUM: { variant: "info", label: "Belum Mulai" },
};

const fmtTanggal = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function GuruDashboard({ session }: { session: Session }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat dashboard");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Dashboard Guru" breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Dashboard Guru" breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}>
        <div className="card p-8 text-center text-red-600 text-sm">{error || "Gagal memuat dashboard"}</div>
      </DashboardLayout>
    );
  }

  const s = data.stats;
  const adaData = s.totalSiklus > 0;
  const pb = data.nilaiTerakhir !== null && data.latestInfo
    ? null
    : null; // predikat diambil dari nilai via helper di bawah
  const predikatTerakhir = (() => {
    if (data.nilaiTerakhir === null) return null;
    const n = data.nilaiTerakhir;
    const kode = n >= 91 ? "SANGAT_BAIK" : n >= 81 ? "BAIK" : n >= 71 ? "CUKUP" : "KURANG";
    return predikatBadge(kode);
  })();
  void pb;

  return (
    <DashboardLayout
      pageTitle="Dashboard Guru"
      breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}
    >
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-gray-800 text-lg font-bold">Selamat datang, {session.user.name} 👋</h2>
        <p className="text-gray-400 text-sm">
          {session.user.sekolahNama ?? "—"} · {session.user.jabatan ?? "Guru"}
        </p>
      </div>

      {!adaData ? (
        <div className="card p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-gray-700 font-semibold mb-1">Belum ada supervisi</h3>
          <p className="text-gray-400 text-sm">
            Hasil supervisi akan muncul di sini setelah supervisor membuat dan menyelesaikan siklus supervisi untuk Anda.
          </p>
        </div>
      ) : (
        <>
          {/* Highlight Card Nilai Terkini */}
          <div
            className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full bg-white/5" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">Nilai Supervisi Terakhir</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold">
                    {data.nilaiTerakhir !== null ? data.nilaiTerakhir.toFixed(1) : "—"}
                  </span>
                  {predikatTerakhir && (
                    <div className="mb-1">
                      <Badge variant={predikatTerakhir.variant as BadgeVariant} className="bg-white/20 text-white border-0">
                        {predikatTerakhir.label}
                      </Badge>
                    </div>
                  )}
                </div>
                <p className="text-white/60 text-xs mt-2">
                  {data.latestInfo
                    ? `${data.latestInfo.mapel ?? "-"} · ${data.latestInfo.kelas ?? "-"} · ${
                        data.latestInfo.semester === "GANJIL" ? "Ganjil" : "Genap"
                      } ${data.latestInfo.tahunAjaran}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs mb-1">Siklus Selesai</p>
                <p className="text-2xl font-bold">
                  {s.selesai}/{s.totalSiklus}
                </p>
                <p className="text-white/60 text-xs">siklus supervisi</p>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <StatCard title="Total Siklus" value={String(s.totalSiklus)} subtitle="Semua waktu" icon={ClipboardList} iconBg="primary" />
            <StatCard title="RTL Berjalan" value={String(s.rtlBerjalan)} subtitle="Perlu ditindaklanjuti" icon={Target} iconBg="warning" />
            <StatCard title="RTL Selesai" value={String(s.rtlSelesai)} subtitle="Sudah tuntas" icon={CheckCircle} iconBg="success" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
            {/* Radar Dimensi */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-gray-800 font-bold text-sm">Profil Dimensi Pembelajaran</h3>
                <p className="text-gray-400 text-xs">Hasil observasi kelas terakhir</p>
              </div>
              <div className="card-body">
                {data.radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={data.radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="dimensi" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <Radar name="Nilai" dataKey="nilai" stroke="#2dce89" fill="#2dce89" fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-16">Belum ada data observasi kelas</p>
                )}
              </div>
            </div>

            {/* Tren Nilai */}
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-argon-primary" />
                <div>
                  <h3 className="text-gray-800 font-bold text-sm">Tren Nilai Supervisi</h3>
                  <p className="text-gray-400 text-xs">Perkembangan antar siklus</p>
                </div>
              </div>
              <div className="card-body">
                {data.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="semester" tick={{ fontSize: 10, fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}`, "Nilai"]} />
                      <Bar dataKey="nilai" fill="#5e72e4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-16">
                    Tren muncul setelah minimal satu siklus selesai
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Skor per komponen pra observasi */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-gray-800 font-bold text-sm">Skor Per Komponen (Pra-Observasi Terakhir)</h3>
                <p className="text-gray-400 text-xs">Persentase capaian per komponen instrumen</p>
              </div>
              <div className="card-body space-y-3">
                {data.komponenPra.length > 0 ? (
                  data.komponenPra.map((k, i) => (
                    <ProgressBar key={i} value={k.nilai} showLabel label={k.label} size="sm" />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-8">Belum ada data pra observasi</p>
                )}
              </div>
            </div>

            {/* RTL */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <h3 className="text-gray-800 font-bold text-sm">Rencana Tindak Lanjut</h3>
                </div>
                <Link href="/guru/rtl" className="text-xs text-argon-primary hover:underline font-medium">
                  Lihat semua
                </Link>
              </div>
              <div className="card-body space-y-3">
                {data.rtlList.length > 0 ? (
                  data.rtlList.map((r, i) => {
                    const st = rtlStatus[r.status] ?? rtlStatus.BELUM;
                    return (
                      <div key={i} className="p-3 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-700">{r.aspek}</p>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{r.rencana}</p>
                        {r.deadline && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Deadline: {fmtTanggal(r.deadline)}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 text-center py-8">
                    Belum ada RTL — dibuat supervisor pada tahap Pasca Supervisi
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
