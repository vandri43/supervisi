"use client";

import { Session } from "next-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import Badge, { statusBadge, predikatBadge, BadgeVariant } from "@/components/ui/Badge";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Users,
  Plus,
  ChevronRight,
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
  CartesianGrid,
  Tooltip,
} from "recharts";
import Link from "next/link";

const radarData = [
  { dimensi: "Berkesadaran", nilai: 82 },
  { dimensi: "Bermakna", nilai: 75 },
  { dimensi: "Menggembirakan", nilai: 88 },
  { dimensi: "Literasi", nilai: 79 },
  { dimensi: "Numerasi", nilai: 71 },
  { dimensi: "Asesmen", nilai: 84 },
];

const barData = [
  { nama: "Siti R.", nilai: 87.5 },
  { nama: "Ahmad F.", nilai: 79.2 },
  { nama: "Dewi L.", nilai: 91.0 },
  { nama: "Budi H.", nilai: 84.3 },
  { nama: "Rina M.", nilai: 76.8 },
  { nama: "Hasan K.", nilai: 88.5 },
];

const guruList = [
  { nama: "Siti Rahayu, S.Pd", mapel: "DKV", status: "SELESAI", predikat: "BAIK", nilai: 87.5, lastUpdate: "2 hari lalu" },
  { nama: "Ahmad Fauzi, S.T", mapel: "TKJ", status: "OBSERVASI", predikat: null, nilai: null, lastUpdate: "1 hari lalu" },
  { nama: "Dewi Lestari, M.Pd", mapel: "B. Inggris", status: "SELESAI", predikat: "SANGAT_BAIK", nilai: 91.0, lastUpdate: "5 hari lalu" },
  { nama: "Budi Hartono, S.Pd", mapel: "Matematika", status: "PASCA_SUPERVISI", predikat: null, nilai: null, lastUpdate: "Hari ini" },
  { nama: "Rina Marlina, S.Pd", mapel: "PJOK", status: "PRA_OBSERVASI", predikat: null, nilai: null, lastUpdate: "3 hari lalu" },
];

const jadwalHariIni = [
  { jam: "08.00", guru: "Budi Hartono, S.Pd", kelas: "X-RPL-1", kegiatan: "Pasca Supervisi" },
  { jam: "10.00", guru: "Rina Marlina, S.Pd", kelas: "XI-PJOK-2", kegiatan: "Pra Observasi" },
  { jam: "13.00", guru: "Hasan Kuswandi, S.Pd", kelas: "XII-MM-1", kegiatan: "Observasi Kelas" },
];

export default function SupervisorDashboard({ session }: { session: Session }) {
  return (
    <DashboardLayout
      pageTitle="Dashboard Supervisor"
      breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}
    >
      {/* Greeting + CTA */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-800 text-lg font-bold">
            Selamat datang, {session.user.name} 👋
          </h2>
          <p className="text-gray-400 text-sm">
            {session.user.sekolahNama ?? "Pengawas Sekolah"} — Semester Ganjil 2025/2026
          </p>
        </div>
        <Link href="/supervisor/siklus/baru" className="btn-primary">
          <Plus className="w-4 h-4" />
          Siklus Baru
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard title="Guru Binaan" value="12" subtitle="Di sekolah Anda" icon={Users} iconBg="primary" />
        <StatCard title="Siklus Aktif" value="5" subtitle="Sedang berjalan" icon={Clock} iconBg="warning" />
        <StatCard title="Siklus Selesai" value="7" subtitle="Semester ini" icon={CheckCircle} iconBg="success" />
        <StatCard title="Total Siklus" value="12" subtitle="Tahun ini" icon={ClipboardList} iconBg="info" />
      </div>

      {/* Charts + Jadwal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* Radar Chart Dimensi */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm">Rata-rata Dimensi</h3>
            <p className="text-gray-400 text-xs">BBM + 3M + Literasi + Numerasi</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={230}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="dimensi" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Radar
                  name="Nilai"
                  dataKey="nilai"
                  stroke="#5e72e4"
                  fill="#5e72e4"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Nilai Guru */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm">Nilai Akhir Per Guru</h3>
            <p className="text-gray-400 text-xs">Guru yang sudah selesai siklus supervisi</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(v) => [`${v}`, "Nilai"]}
                />
                <Bar dataKey="nilai" fill="#5e72e4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Daftar Guru */}
        <div className="card xl:col-span-2">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-gray-800 font-bold text-sm">Guru Binaan</h3>
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
                {guruList.map((g, i) => {
                  const sb = statusBadge(g.status);
                  const pb = g.predikat ? predikatBadge(g.predikat) : null;
                  return (
                    <tr key={i}>
                      <td>
                        <p className="font-medium text-gray-700 text-xs">{g.nama}</p>
                        <p className="text-gray-400 text-xs">{g.mapel}</p>
                      </td>
                      <td><Badge variant={sb.variant as BadgeVariant}>{sb.label}</Badge></td>
                      <td>
                        {g.nilai ? (
                          <div>
                            <span className="font-bold text-gray-700 text-sm">{g.nilai.toFixed(1)}</span>
                            {pb && (
                              <Badge variant={pb.variant as BadgeVariant} className="ml-1 text-xs">
                                {pb.label}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="text-gray-400 text-xs">{g.lastUpdate}</td>
                      <td>
                        <Link
                          href={`/supervisor/siklus`}
                          className="text-argon-primary hover:text-argon-primary-dark"
                        >
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

        {/* Jadwal Hari Ini */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Calendar className="w-4 h-4 text-argon-primary" />
            <h3 className="text-gray-800 font-bold text-sm">Jadwal Hari Ini</h3>
          </div>
          <div className="card-body space-y-3">
            {jadwalHariIni.map((j, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors">
                <div className="text-center flex-shrink-0">
                  <p className="text-xs font-bold text-argon-primary">{j.jam}</p>
                  <div className="w-px h-full bg-gray-200 mx-auto mt-1" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{j.guru}</p>
                  <p className="text-xs text-gray-400">{j.kelas} · {j.kegiatan}</p>
                </div>
              </div>
            ))}
            {jadwalHariIni.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                Tidak ada jadwal hari ini
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

