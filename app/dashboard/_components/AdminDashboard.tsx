"use client";

import { useCallback, useEffect, useState } from "react";
import { Session } from "next-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import Badge, { statusBadge, BadgeVariant } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  School,
  Users,
  ClipboardList,
  CheckCircle,
  TrendingUp,
  Loader2,
  Inbox,
  UserCog,
  GraduationCap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Link from "next/link";

interface DashboardData {
  role: string;
  stats: {
    totalSekolah: number;
    totalUsers: number;
    guruCount: number;
    supervisorCount: number;
    totalSiklus: number;
    selesai: number;
    berjalan: number;
  };
  areaData: { bulan: string; selesai: number; proses: number }[];
  pieData: { name: string; value: number; color: string }[];
  recentSiklus: { id: string; guru: string; sekolah: string; mapel: string; status: string; nilai: number | null }[];
  sekolahStats: { nama: string; total: number; selesai: number; avg: number }[];
}

export default function AdminDashboard({ session }: { session: Session }) {
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
      <DashboardLayout pageTitle="Dashboard Administrator" breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Dashboard Administrator" breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}>
        <div className="card p-8 text-center text-red-600 text-sm">{error || "Gagal memuat dashboard"}</div>
      </DashboardLayout>
    );
  }

  const s = data.stats;
  const persenSelesai = s.totalSiklus > 0 ? Math.round((s.selesai / s.totalSiklus) * 100) : 0;
  const adaData = s.totalSiklus > 0;

  return (
    <DashboardLayout
      pageTitle="Dashboard Administrator"
      breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}
    >
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-gray-800 text-lg font-bold">Selamat datang, {session.user.name} 👋</h2>
        <p className="text-gray-400 text-sm">Berikut ringkasan data supervisi seluruh sekolah.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard title="Total Sekolah" value={String(s.totalSekolah)} subtitle="Sekolah terdaftar" icon={School} iconBg="primary" />
        <StatCard title="Total Pengguna" value={String(s.totalUsers)} subtitle={`${s.guruCount} guru · ${s.supervisorCount} supervisor`} icon={Users} iconBg="info" />
        <StatCard title="Siklus Berjalan" value={String(s.berjalan)} subtitle="Sedang berjalan" icon={ClipboardList} iconBg="warning" />
        <StatCard
          title="Siklus Selesai"
          value={String(s.selesai)}
          subtitle={s.totalSiklus > 0 ? `${persenSelesai}% dari ${s.totalSiklus} siklus` : "Belum ada siklus"}
          icon={CheckCircle}
          iconBg="success"
        />
      </div>

      {!adaData ? (
        <div className="card p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-gray-700 font-semibold mb-1">Belum ada siklus supervisi</h3>
          <p className="text-gray-400 text-sm">
            Grafik dan rekap akan terisi otomatis setelah supervisor membuat siklus supervisi.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            {/* Area Chart */}
            <div className="card xl:col-span-2">
              <div className="card-header flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800 font-bold text-sm">Siklus 6 Bulan Terakhir</h3>
                  <p className="text-gray-400 text-xs">Dibuat per bulan: selesai vs. berjalan</p>
                </div>
                <TrendingUp className="w-4 h-4 text-gray-300" />
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.areaData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5e72e4" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#5e72e4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dce89" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2dce89" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Area type="monotone" dataKey="selesai" name="Selesai" stroke="#5e72e4" strokeWidth={2} fill="url(#colorSelesai)" />
                    <Area type="monotone" dataKey="proses" name="Berjalan" stroke="#2dce89" strokeWidth={2} fill="url(#colorProses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-gray-800 font-bold text-sm">Distribusi Predikat</h3>
                <p className="text-gray-400 text-xs">Hasil akhir supervisi</p>
              </div>
              <div className="card-body flex flex-col items-center">
                {data.pieData.some((p) => p.value > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.pieData.filter((p) => p.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                          {data.pieData.filter((p) => p.value > 0).map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full space-y-1.5 mt-1">
                      {data.pieData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-gray-500">{item.name}</span>
                          </div>
                          <span className="font-semibold text-gray-700">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-16">
                    Belum ada siklus yang selesai — predikat muncul setelah Pasca Supervisi diselesaikan
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Siklus Terbaru */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="text-gray-800 font-bold text-sm">Siklus Terbaru</h3>
                <Link href="/supervisor/siklus" className="text-xs text-argon-primary hover:underline font-medium">
                  Lihat semua
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table-argon">
                  <thead>
                    <tr>
                      <th>Guru</th>
                      <th>Mapel</th>
                      <th>Status</th>
                      <th>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSiklus.map((item) => {
                      const sb = statusBadge(item.status);
                      return (
                        <tr key={item.id}>
                          <td>
                            <p className="font-medium text-gray-700 text-xs">{item.guru}</p>
                            <p className="text-gray-400 text-xs">{item.sekolah}</p>
                          </td>
                          <td className="text-gray-500 text-xs">{item.mapel}</td>
                          <td>
                            <Badge variant={sb.variant as BadgeVariant}>{sb.label}</Badge>
                          </td>
                          <td className="font-semibold text-xs text-gray-700">
                            {item.nilai !== null ? item.nilai.toFixed(1) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performa Per Sekolah */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="text-gray-800 font-bold text-sm">Performa Per Sekolah</h3>
                <Link href="/admin/sekolah" className="text-xs text-argon-primary hover:underline font-medium">
                  Kelola sekolah
                </Link>
              </div>
              <div className="card-body space-y-4">
                {data.sekolahStats.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Belum ada sekolah terdaftar</p>
                )}
                {data.sekolahStats.map((sk) => (
                  <div key={sk.nama}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{sk.nama}</p>
                        <p className="text-xs text-gray-400">
                          {sk.selesai}/{sk.total} siklus selesai
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{sk.avg > 0 ? sk.avg : "—"}</span>
                    </div>
                    <ProgressBar value={sk.avg} showLabel={false} size="sm" />
                  </div>
                ))}
                {data.sekolahStats.length > 0 && data.sekolahStats.every((sk) => sk.total === 0) && (
                  <p className="text-xs text-gray-400 text-center pt-2">Belum ada siklus pada sekolah mana pun</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Info pengguna */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{s.guruCount}</p>
            <p className="text-xs text-gray-400">Guru terdaftar</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-50 text-purple-600">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{s.supervisorCount}</p>
            <p className="text-xs text-gray-400">Supervisor terdaftar</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
