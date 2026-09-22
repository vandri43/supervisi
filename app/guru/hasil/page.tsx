"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { statusBadge, predikatBadge, BadgeVariant } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const riwayatSiklus = [
  {
    id: "1",
    tahunAjaran: "2025/2026",
    semester: "Ganjil",
    kelas: "X-DKV-1",
    mapel: "Desain Komunikasi Visual",
    topik: "Desain Poster Digital",
    supervisor: "Drs. Budi Santoso, M.Pd",
    tanggal: "15 Sep 2025",
    status: "SELESAI",
    predikat: "BAIK",
    nilaiAkhir: 87.5,
    komponenNilai: {
      praObservasi: 85.0,
      observasiKelas: 88.6,
      pascaSupervisi: 89.0,
    },
    dimensi: [
      { dimensi: "Berkesadaran", nilai: 85 },
      { dimensi: "Bermakna", nilai: 82 },
      { dimensi: "Menggembirakan", nilai: 90 },
      { dimensi: "Literasi", nilai: 83 },
      { dimensi: "Numerasi", nilai: 78 },
      { dimensi: "Asesmen", nilai: 88 },
    ],
    rtl: [
      { aspek: "Numerasi", rencana: "Integrasikan data statistik dalam materi DKV", status: "PROSES", deadline: "30 Okt 2025" },
      { aspek: "Asesmen Formatif", rencana: "Terapkan kuis singkat setiap akhir sesi", status: "SELESAI", deadline: "1 Okt 2025" },
    ],
  },
  {
    id: "2",
    tahunAjaran: "2024/2025",
    semester: "Genap",
    kelas: "XI-DKV-2",
    mapel: "Desain Komunikasi Visual",
    topik: "Tipografi Digital",
    supervisor: "Drs. Budi Santoso, M.Pd",
    tanggal: "10 Mar 2025",
    status: "SELESAI",
    predikat: "BAIK",
    nilaiAkhir: 82.0,
    komponenNilai: {
      praObservasi: 80.0,
      observasiKelas: 83.0,
      pascaSupervisi: 83.0,
    },
    dimensi: [
      { dimensi: "Berkesadaran", nilai: 80 },
      { dimensi: "Bermakna", nilai: 78 },
      { dimensi: "Menggembirakan", nilai: 85 },
      { dimensi: "Literasi", nilai: 80 },
      { dimensi: "Numerasi", nilai: 72 },
      { dimensi: "Asesmen", nilai: 83 },
    ],
    rtl: [
      { aspek: "Numerasi", rencana: "Tambahkan analisis proporsi dalam desain", status: "SELESAI", deadline: "1 Jun 2025" },
    ],
  },
  {
    id: "3",
    tahunAjaran: "2024/2025",
    semester: "Ganjil",
    kelas: "X-DKV-1",
    mapel: "Desain Komunikasi Visual",
    topik: "Pengantar Desain Grafis",
    supervisor: "Drs. Budi Santoso, M.Pd",
    tanggal: "20 Sep 2024",
    status: "SELESAI",
    predikat: "CUKUP",
    nilaiAkhir: 78.5,
    komponenNilai: {
      praObservasi: 77.0,
      observasiKelas: 79.5,
      pascaSupervisi: 79.0,
    },
    dimensi: [
      { dimensi: "Berkesadaran", nilai: 75 },
      { dimensi: "Bermakna", nilai: 72 },
      { dimensi: "Menggembirakan", nilai: 80 },
      { dimensi: "Literasi", nilai: 76 },
      { dimensi: "Numerasi", nilai: 68 },
      { dimensi: "Asesmen", nilai: 78 },
    ],
    rtl: [
      { aspek: "Bermakna", rencana: "Perbanyak contoh kontekstual", status: "SELESAI", deadline: "1 Jan 2025" },
      { aspek: "Numerasi", rencana: "Masukkan elemen numerasi dalam tugas", status: "SELESAI", deadline: "1 Jan 2025" },
    ],
  },
];

const rtlStatusStyle: Record<string, { variant: "success" | "warning" | "info"; label: string }> = {
  SELESAI: { variant: "success", label: "Selesai" },
  PROSES:  { variant: "warning", label: "Dalam Proses" },
  BELUM:   { variant: "info",    label: "Belum Mulai" },
};

export default function HasilSupervisiPage() {
  const [expandedId, setExpandedId] = useState<string>("1");

  const latestSiklus = riwayatSiklus[0];
  const pb = predikatBadge(latestSiklus.predikat);

  return (
    <DashboardLayout
      pageTitle="Hasil Supervisi Saya"
      breadcrumbs={[{ label: "Guru" }, { label: "Hasil Supervisi" }]}
    >
      {/* Highlight — nilai terbaru */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* Card utama */}
        <div
          className="xl:col-span-2 rounded-2xl p-6 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-8 -bottom-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                  Supervisi Terakhir · {latestSiklus.semester} {latestSiklus.tahunAjaran}
                </p>
                <h2 className="text-white font-bold text-lg">{latestSiklus.topik}</h2>
                <p className="text-white/60 text-sm">{latestSiklus.kelas} · {latestSiklus.mapel}</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold leading-none">{latestSiklus.nilaiAkhir.toFixed(1)}</p>
                <Badge variant={pb.variant as BadgeVariant} className="bg-white/20 text-white mt-1">
                  {pb.label}
                </Badge>
              </div>
            </div>

            {/* Komponen nilai */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Pra Observasi", nilai: latestSiklus.komponenNilai.praObservasi },
                { label: "Observasi Kelas", nilai: latestSiklus.komponenNilai.observasiKelas },
                { label: "Pasca Supervisi", nilai: latestSiklus.komponenNilai.pascaSupervisi },
              ].map((k, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-white text-xl font-bold">{k.nilai.toFixed(1)}</p>
                  <p className="text-white/60 text-xs mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{latestSiklus.supervisor}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{latestSiklus.tanggal}</span>
            </div>
          </div>
        </div>

        {/* Radar dimensi terbaru */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm">Profil Dimensi Terbaru</h3>
            <p className="text-gray-400 text-xs">BBM · 3M · Literasi · Numerasi</p>
          </div>
          <div className="card-body p-2">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={latestSiklus.dimensi}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="dimensi" tick={{ fontSize: 9, fill: "#9ca3af" }} />
                <Radar
                  dataKey="nilai"
                  stroke="#5e72e4"
                  fill="#5e72e4"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="px-2 space-y-1.5 mt-1">
              {latestSiklus.dimensi.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-500">{d.dimensi}</span>
                    <span className="font-semibold text-gray-600">{d.nilai}</span>
                  </div>
                  <ProgressBar value={d.nilai} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tren ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {riwayatSiklus.map((s, i) => {
          const pb2 = predikatBadge(s.predikat);
          return (
            <div key={s.id} className={`card p-4 border-l-4 ${
              i === 0 ? "border-l-indigo-500" : "border-l-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-500">{s.semester} {s.tahunAjaran}</p>
                <Badge variant={pb2.variant as BadgeVariant}>{pb2.label}</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-800">{s.nilaiAkhir.toFixed(1)}</p>
              <p className="text-xs text-gray-400 truncate">{s.topik}</p>
              {i > 0 && (
                <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                  s.nilaiAkhir < riwayatSiklus[i - 1].nilaiAkhir ? "text-green-500" : "text-gray-400"
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {i === 1
                    ? `+${(latestSiklus.nilaiAkhir - s.nilaiAkhir).toFixed(1)} dari semester ini`
                    : `+${(riwayatSiklus[1].nilaiAkhir - s.nilaiAkhir).toFixed(1)} dari sebelumnya`}
                </p>
              )}
              {i === 0 && (
                <p className="text-xs text-indigo-500 font-medium mt-1 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Supervisi terkini
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Riwayat detail accordion */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-gray-800 font-bold text-sm">Riwayat Siklus Supervisi</h3>
          <p className="text-gray-400 text-xs">{riwayatSiklus.length} siklus supervisi tercatat</p>
        </div>
        <div className="divide-y divide-gray-100">
          {riwayatSiklus.map((s) => {
            const isOpen = expandedId === s.id;
            const pb3 = predikatBadge(s.predikat);
            const sb = statusBadge(s.status);

            return (
              <div key={s.id}>
                {/* Header accordion */}
                <button
                  onClick={() => setExpandedId(isOpen ? "" : s.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 text-sm">{s.topik}</p>
                        <Badge variant={sb.variant as BadgeVariant}>{sb.label}</Badge>
                        <Badge variant={pb3.variant as BadgeVariant}>{pb3.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.kelas} · {s.semester} {s.tahunAjaran} · {s.tanggal}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xl font-bold text-gray-800">{s.nilaiAkhir.toFixed(1)}</p>
                      <p className="text-xs text-gray-400">Nilai Akhir</p>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </button>

                {/* Detail accordion */}
                {isOpen && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {/* Skor per komponen */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Skor Per Tahap</p>
                        <div className="space-y-3">
                          {[
                            { label: "Pra Observasi (Telaah RPP/RPM)", nilai: s.komponenNilai.praObservasi },
                            { label: "Observasi Kelas", nilai: s.komponenNilai.observasiKelas },
                            { label: "Pasca Supervisi", nilai: s.komponenNilai.pascaSupervisi },
                          ].map((k, i) => (
                            <ProgressBar key={i} value={k.nilai} label={k.label} showLabel size="md" />
                          ))}
                        </div>

                        <p className="text-xs font-semibold text-gray-400 uppercase mb-3 mt-5">Profil Dimensi</p>
                        <div className="space-y-2">
                          {s.dimensi.map((d, i) => (
                            <ProgressBar key={i} value={d.nilai} label={d.dimensi} showLabel />
                          ))}
                        </div>
                      </div>

                      {/* RTL */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                          Rencana Tindak Lanjut ({s.rtl.length})
                        </p>
                        <div className="space-y-3">
                          {s.rtl.map((r, i) => {
                            const st = rtlStatusStyle[r.status];
                            return (
                              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="text-sm font-semibold text-gray-700">{r.aspek}</p>
                                  <Badge variant={st.variant}>{st.label}</Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{r.rencana}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Deadline: {r.deadline}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Info supervisor */}
                        <div className="mt-5 p-4 bg-indigo-50 rounded-xl">
                          <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Informasi Supervisi</p>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p><span className="text-gray-400">Supervisor:</span> {s.supervisor}</p>
                            <p><span className="text-gray-400">Tanggal:</span> {s.tanggal}</p>
                            <p><span className="text-gray-400">Kelas:</span> {s.kelas}</p>
                            <p><span className="text-gray-400">Mata Pelajaran:</span> {s.mapel}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

