"use client";

import { useCallback, useEffect, useState } from "react";
import { Session } from "next-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import Badge, { statusBadge, BadgeVariant } from "@/components/ui/Badge";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Users,
  Plus,
  ChevronRight,
  Loader2,
  Inbox,
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
  CartesianGrid,
  Tooltip,
} from "recharts";
import Link from "next/link";

interface DashboardData {
  role: string;
  stats: { guruBinaan: number; berjalan: number; selesai: number; totalSiklus: number };
  radarData: { dimensi: string; nilai: number }[];
  barData: { nama: string; nilai: number }[];
  guruList: { nama: string; mapel: string; status: string; nilai: number | null; lastUpdate: string }[];
}

export default function SupervisorDashboard({ session }: { session: Session }) {
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
      <DashboardLayout pageTitle="Dashboard Supervisor" breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Dashboard Supervisor" breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}>
        <div className="card p-8 text-center text-red-600 text-sm">{error || "Gagal memuat dashboard"}</div>
      </DashboardLayout>
    );
  }

  const s = data.stats;
  const adaData = s.totalSiklus > 0;

  return (
    <DashboardLayout
      pageTitle="Dashboard Supervisor"
      breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}
    >
      {/* Greeting + CTA */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-gray-800 text-lg font-bold">Selamat datang, {session.user.name} 👋</h2>
          <p className="text-gray-400 text-sm">{session.user.sekolahNama ?? "Pengawas Sekolah"}</p>
        </div>
        <Link href="/supervisor/siklus/baru" className="btn-primary">
          <Plus className="w-4 h-4" />
          Siklus Baru
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard title="Guru Binaan" value={String(s.guruBinaan)} subtitle="Pernah disupervisi" icon={Users} iconBg="primary" />
        <StatCard title="Siklus Aktif" value={String(s.berjalan)} subtitle="Sedang berjalan" icon={Clock} iconBg="warning" />
        <StatCard title="Siklus Selesai" value={String(s.selesai)} subtitle="Sampai tahap akhir" icon={CheckCircle} iconBg="success" />
        <StatCard title="Total Siklus" value={String(s.totalSiklus)} subtitle="Semua waktu" icon={ClipboardList} iconBg="info" />
      </div>

      {!adaData ? (
        <div className="card p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-gray-700 font-semibold mb-1">Belum ada siklus supervisi</h3>
          <p className="text-gray-400 text-sm mb-4">
            Mulai dengan membuat siklus supervisi untuk guru binaan Anda.
          </p>
          <Link href="/supervisor/siklus/baru" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Buat Siklus Baru
          </Link>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            {/* Radar Chart Dimensi */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-gray-800 font-bold text-sm">Rata-rata Dimensi</h3>
                <p className="text-gray-400 text-xs">Hasil observasi kelas guru binaan</p>
              </div>
              <div className="card-body">
                {data.radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
                    <RadarChart data={data.radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="dimensi" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <Radar name="Nilai" dataKey="nilai" stroke="#5e72e4" fill="#5e72e4" fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-16">Belum ada data observasi kelas</p>
                )}
              </div>
            </div>

            {/* Bar Chart Nilai Guru */}
            <div className="card xl:col-span-2">
              <div className="card-header">
                <h3 className="text-gray-800 font-bold text-sm">Nilai Akhir Per Guru</h3>
                <p className="text-gray-400 text-xs">Guru yang sudah menyelesaikan siklus supervisi</p>
              </div>
              <div className="card-body">
                {data.barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={data.barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v) => [`${v}`, "Nilai"]} />
                      <Bar dataKey="nilai" fill="#5e72e4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-16">
                    Belum ada guru yang menyelesaikan siklus — nilai muncul setelah Pasca Supervisi selesai
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Daftar Guru */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-gray-800 font-bold text-sm">Aktivitas Guru Binaan</h3>
              <Link href="/supervisor/siklus" className="text-xs text-argon-primary hover:underline font-medium">
                Semua siklus
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table-argon">
                <thead>
                  <tr>
                    <th>Guru</th>
                    <th>Status Siklus</th>
                    <th>Nilai</th>
                    <th>Update</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.guruList.map((g) => {
                    const sb = statusBadge(g.status);
                    return (
                      <tr key={g.nama}>
                        <td>
                          <p className="font-medium text-gray-700 text-xs">{g.nama}</p>
                          <p className="text-gray-400 text-xs">{g.mapel}</p>
                        </td>
                        <td><Badge variant={sb.variant as BadgeVariant}>{sb.label}</Badge></td>
                        <td>
                          {g.nilai !== null ? (
                            <span className="font-bold text-gray-700 text-sm">{g.nilai.toFixed(1)}</span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="text-gray-400 text-xs">{g.lastUpdate}</td>
                        <td>
                          <Link href="/supervisor/siklus" className="text-argon-primary hover:text-argon-primary-dark">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
