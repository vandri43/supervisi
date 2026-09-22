"use client";

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
  AlertCircle,
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
} from "recharts";

// Data dummy — akan diganti dengan data real dari API
const areaData = [
  { bulan: "Jan", selesai: 4, proses: 2 },
  { bulan: "Feb", selesai: 7, proses: 3 },
  { bulan: "Mar", selesai: 5, proses: 4 },
  { bulan: "Apr", selesai: 10, proses: 2 },
  { bulan: "Mei", selesai: 8, proses: 5 },
  { bulan: "Jun", selesai: 12, proses: 3 },
  { bulan: "Jul", selesai: 9, proses: 6 },
  { bulan: "Agu", selesai: 14, proses: 4 },
];

const pieData = [
  { name: "Sangat Baik", value: 32, color: "#2dce89" },
  { name: "Baik", value: 45, color: "#5e72e4" },
  { name: "Cukup", value: 18, color: "#fb6340" },
  { name: "Kurang", value: 5, color: "#f5365c" },
];

const recentSiklus = [
  { guru: "Siti Rahayu, S.Pd", sekolah: "SMKN 1 Contoh", mapel: "DKV", status: "SELESAI", nilai: 87.5 },
  { guru: "Ahmad Fauzi, S.T", sekolah: "SMKN 1 Contoh", mapel: "TKJ", status: "OBSERVASI", nilai: null },
  { guru: "Dewi Lestari, M.Pd", sekolah: "SMKN 2 Contoh", mapel: "Bahasa Inggris", status: "PRA_OBSERVASI", nilai: null },
  { guru: "Budi Hartono, S.Pd", sekolah: "SMKN 2 Contoh", mapel: "Matematika", status: "SELESAI", nilai: 91.2 },
  { guru: "Rina Marlina, S.Pd", sekolah: "SMKN 1 Contoh", mapel: "PJOK", status: "PASCA_SUPERVISI", nilai: null },
];

const sekolahStats = [
  { nama: "SMKN 1 Contoh", total: 24, selesai: 18, avg: 84.3 },
  { nama: "SMKN 2 Contoh", total: 20, selesai: 14, avg: 79.8 },
  { nama: "SMKN 3 Contoh", total: 16, selesai: 10, avg: 88.1 },
  { nama: "SMKN 4 Contoh", total: 12, selesai: 6, avg: 75.5 },
];

export default function AdminDashboard({ session }: { session: Session }) {
  return (
    <DashboardLayout
      pageTitle="Dashboard Administrator"
      breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}
    >
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-gray-800 text-lg font-bold">
          Selamat datang, {session.user.name} 👋
        </h2>
        <p className="text-gray-400 text-sm">
          Berikut ringkasan data supervisi seluruh sekolah.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="Total Sekolah"
          value="4"
          subtitle="Sekolah terdaftar"
          icon={School}
          iconBg="primary"
          trend={{ value: "+1 bulan ini", positive: true }}
        />
        <StatCard
          title="Total Pengguna"
          value="128"
          subtitle="Supervisor & Guru"
          icon={Users}
          iconBg="info"
          trend={{ value: "+12 bulan ini", positive: true }}
        />
        <StatCard
          title="Siklus Berjalan"
          value="72"
          subtitle="Tahun ajaran ini"
          icon={ClipboardList}
          iconBg="warning"
        />
        <StatCard
          title="Siklus Selesai"
          value="48"
          subtitle="Dari 72 siklus"
          icon={CheckCircle}
          iconBg="success"
          trend={{ value: "66.7% completion", positive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* Area Chart */}
        <div className="card xl:col-span-2">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-gray-800 font-bold text-sm">Progres Supervisi</h3>
              <p className="text-gray-400 text-xs">Siklus selesai vs. sedang berjalan per bulan</p>
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300" />
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Area type="monotone" dataKey="selesai" name="Selesai" stroke="#5e72e4" strokeWidth={2} fill="url(#colorSelesai)" />
                <Area type="monotone" dataKey="proses" name="Proses" stroke="#2dce89" strokeWidth={2} fill="url(#colorProses)" />
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
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5 mt-1">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-500">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Siklus Terbaru */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-gray-800 font-bold text-sm">Siklus Terbaru</h3>
            <a href="/admin/siklus" className="text-xs text-argon-primary hover:underline font-medium">
              Lihat semua
            </a>
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
                {recentSiklus.map((item, i) => {
                  const sb = statusBadge(item.status);
                  return (
                    <tr key={i}>
                      <td>
                        <p className="font-medium text-gray-700 text-xs">{item.guru}</p>
                        <p className="text-gray-400 text-xs">{item.sekolah}</p>
                      </td>
                      <td className="text-gray-500 text-xs">{item.mapel}</td>
                      <td>
                        <Badge variant={sb.variant as BadgeVariant}>{sb.label}</Badge>
                      </td>
                      <td className="font-semibold text-xs text-gray-700">
                        {item.nilai ? item.nilai.toFixed(1) : "—"}
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
            <AlertCircle className="w-4 h-4 text-gray-300" />
          </div>
          <div className="card-body space-y-4">
            {sekolahStats.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{s.nama}</p>
                    <p className="text-xs text-gray-400">
                      {s.selesai}/{s.total} siklus selesai
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{s.avg}</span>
                </div>
                <ProgressBar value={s.avg} showLabel={false} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

