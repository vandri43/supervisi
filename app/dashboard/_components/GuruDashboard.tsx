"use client";

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

const radarData = [
  { dimensi: "Berkesadaran", nilai: 82 },
  { dimensi: "Bermakna", nilai: 75 },
  { dimensi: "Menggembirakan", nilai: 88 },
  { dimensi: "Literasi", nilai: 79 },
  { dimensi: "Numerasi", nilai: 71 },
  { dimensi: "Asesmen", nilai: 84 },
];

const trendData = [
  { semester: "G 24/25", nilai: 78.5 },
  { semester: "G 24/25", nilai: 82.0 },
  { semester: "G 25/26", nilai: 87.5 },
];

const rtlList = [
  { aspek: "Asesmen Formatif", rencana: "Menerapkan kuis singkat setiap akhir sesi", status: "PROSES", deadline: "15 Okt 2025" },
  { aspek: "Numerasi", rencana: "Integrasikan data statistik dalam materi DKV", status: "BELUM", deadline: "30 Okt 2025" },
  { aspek: "Refleksi Pembelajaran", rencana: "Jurnal refleksi mingguan peserta didik", status: "SELESAI", deadline: "1 Sep 2025" },
];

const komponenPraObservasi = [
  { label: "Identitas & Tujuan", nilai: 90 },
  { label: "Materi & Bahan Ajar", nilai: 85 },
  { label: "Metode Pembelajaran", nilai: 80 },
  { label: "Penilaian", nilai: 78 },
  { label: "Literasi & Numerasi", nilai: 72 },
];

const rtlStatus: Record<string, { variant: "success" | "warning" | "info"; label: string }> = {
  SELESAI: { variant: "success", label: "Selesai" },
  PROSES:  { variant: "warning", label: "Proses" },
  BELUM:   { variant: "info",    label: "Belum Mulai" },
};

export default function GuruDashboard({ session }: { session: Session }) {
  const nilaiAkhir = 87.5;
  const predikat = predikatBadge("BAIK");

  return (
    <DashboardLayout
      pageTitle="Dashboard Guru"
      breadcrumbs={[{ label: "Beranda" }, { label: "Dashboard" }]}
    >
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-gray-800 text-lg font-bold">
          Selamat datang, {session.user.name} 👋
        </h2>
        <p className="text-gray-400 text-sm">
          {session.user.sekolahNama ?? "—"} · {session.user.jabatan ?? "Guru"}
        </p>
      </div>

      {/* Highlight Card Nilai Terkini */}
      <div
        className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Nilai Supervisi Terakhir</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold">{nilaiAkhir}</span>
              <div className="mb-1">
                <Badge variant={predikat.variant as BadgeVariant} className="bg-white/20 text-white border-0">
                  {predikat.label}
                </Badge>
              </div>
            </div>
            <p className="text-white/60 text-xs mt-2">Semester Ganjil 2025/2026 · DKV Kelas X</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs mb-1">Completion</p>
            <p className="text-2xl font-bold">100%</p>
            <p className="text-white/60 text-xs">Semua tahap selesai</p>
          </div>
        </div>
        <div className="relative mt-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${nilaiAkhir}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatCard title="Total Siklus" value="3" subtitle="Sepanjang karir" icon={ClipboardList} iconBg="primary" />
        <StatCard title="RTL Berjalan" value="2" subtitle="Perlu ditindaklanjuti" icon={Target} iconBg="warning" />
        <StatCard title="RTL Selesai" value="1" subtitle="Semester ini" icon={CheckCircle} iconBg="success" />
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
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="dimensi" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Radar
                  name="Nilai"
                  dataKey="nilai"
                  stroke="#2dce89"
                  fill="#2dce89"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tren Nilai */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-argon-primary" />
            <div>
              <h3 className="text-gray-800 font-bold text-sm">Tren Nilai Supervisi</h3>
              <p className="text-gray-400 text-xs">Perkembangan antar semester</p>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="semester" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}`, "Nilai"]} />
                <Bar dataKey="nilai" fill="#5e72e4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Komponen Per Aspek */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm">Skor Per Komponen (Pra-Observasi)</h3>
            <p className="text-gray-400 text-xs">Telaah RPP/RPM terakhir</p>
          </div>
          <div className="card-body space-y-3">
            {komponenPraObservasi.map((k, i) => (
              <div key={i}>
                <ProgressBar value={k.nilai} showLabel label={k.label} size="sm" />
              </div>
            ))}
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
            {rtlList.map((r, i) => {
              const s = rtlStatus[r.status];
              return (
                <div key={i} className="p-3 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-700">{r.aspek}</p>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{r.rencana}</p>
                  <p className="text-xs text-gray-400">Deadline: {r.deadline}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

