"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FotoDokumentasi from "@/components/FotoDokumentasi";
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
  Loader2,
  Inbox,
  Camera,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface HasilRow {
  id: string;
  tahunAjaran: string;
  semester: string;
  kelas: string | null;
  mapel: string | null;
  topik: string | null;
  guru?: string;
  supervisor: string;
  tanggal: string | null;
  status: string;
  nilaiAkhir: number | null;
  predikat: string | null;
  komponenNilai: {
    praObservasi: number | null;
    observasiKelas: number | null;
    pascaSupervisi: number | null;
  };
  dimensi: { dimensi: string; nilai: number }[];
  rtl: { id: string; aspek: string; rencana: string; status: string; deadline: string | null }[];
}

const rtlStatusStyle: Record<string, { variant: "success" | "warning" | "info"; label: string }> = {
  SELESAI: { variant: "success", label: "Selesai" },
  PROSES:  { variant: "warning", label: "Dalam Proses" },
  BELUM:   { variant: "info",    label: "Belum Mulai" },
};

const fmtTanggal = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function HasilSupervisiPage() {
  const [list, setList] = useState<HasilRow[]>([]);
  const [expandedId, setExpandedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHasil = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guru/hasil");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat hasil supervisi");
      setList(json);
      if (json.length > 0) setExpandedId(json[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat hasil supervisi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHasil();
  }, [fetchHasil]);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Hasil Supervisi Saya" breadcrumbs={[{ label: "Guru" }, { label: "Hasil Supervisi" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat hasil supervisi...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Hasil Supervisi Saya" breadcrumbs={[{ label: "Guru" }, { label: "Hasil Supervisi" }]}>
        <div className="max-w-lg mx-auto card p-8 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (list.length === 0) {
    return (
      <DashboardLayout pageTitle="Hasil Supervisi Saya" breadcrumbs={[{ label: "Guru" }, { label: "Hasil Supervisi" }]}>
        <div className="card p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-gray-700 font-semibold mb-1">Belum ada hasil supervisi</h3>
          <p className="text-gray-400 text-sm">
            Hasil supervisi akan muncul di sini setelah supervisor menyelesaikan siklus supervisi untuk Anda.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const latest = list[0];
  const pb = latest.predikat ? predikatBadge(latest.predikat) : null;
  const selesaiCount = list.filter((s) => s.status === "SELESAI").length;

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
                  Supervisi Terbaru · {latest.semester === "GANJIL" ? "Ganjil" : "Genap"} {latest.tahunAjaran}
                </p>
                <h2 className="text-white font-bold text-lg">{latest.topik ?? "(tanpa topik)"}</h2>
                <p className="text-white/60 text-sm">
                  {latest.guru ? `${latest.guru} · ` : ""}{latest.kelas ?? "-"} · {latest.mapel ?? "-"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold leading-none">
                  {latest.nilaiAkhir !== null ? latest.nilaiAkhir.toFixed(1) : "—"}
                </p>
                {pb && (
                  <Badge variant={pb.variant as BadgeVariant} className="bg-white/20 text-white mt-1">
                    {pb.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Komponen nilai */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Pra Observasi", nilai: latest.komponenNilai.praObservasi },
                { label: "Observasi Kelas", nilai: latest.komponenNilai.observasiKelas },
                { label: "Pasca Supervisi", nilai: latest.komponenNilai.pascaSupervisi },
              ].map((k, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-white text-xl font-bold">{k.nilai !== null ? k.nilai.toFixed(1) : "—"}</p>
                  <p className="text-white/60 text-xs mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{latest.supervisor}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtTanggal(latest.tanggal)}</span>
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
            {latest.dimensi.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={latest.dimensi}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="dimensi" tick={{ fontSize: 9, fill: "#9ca3af" }} />
                    <Radar dataKey="nilai" stroke="#5e72e4" fill="#5e72e4" fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="px-2 space-y-1.5 mt-1">
                  {latest.dimensi.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-500">{d.dimensi}</span>
                        <span className="font-semibold text-gray-600">{d.nilai}</span>
                      </div>
                      <ProgressBar value={d.nilai} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center py-10">Belum ada data observasi kelas</p>
            )}
          </div>
        </div>
      </div>

      {/* Tren ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {list.slice(0, 3).map((s, i) => {
          const pb2 = s.predikat ? predikatBadge(s.predikat) : null;
          const prev = i > 0 ? list[i - 1] : null;
          return (
            <div key={s.id} className={`card p-4 border-l-4 ${i === 0 ? "border-l-indigo-500" : "border-l-gray-200"}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-500">
                  {s.semester === "GANJIL" ? "Ganjil" : "Genap"} {s.tahunAjaran}
                </p>
                {pb2 && <Badge variant={pb2.variant as BadgeVariant}>{pb2.label}</Badge>}
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {s.nilaiAkhir !== null ? s.nilaiAkhir.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-gray-400 truncate">{s.topik ?? "-"}</p>
              {prev?.nilaiAkhir != null && s.nilaiAkhir !== null && (
                <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                  s.nilaiAkhir < prev.nilaiAkhir ? "text-green-500" : "text-gray-400"
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {s.nilaiAkhir < prev.nilaiAkhir
                    ? `+${(prev.nilaiAkhir - s.nilaiAkhir).toFixed(1)} lebih baik dari sebelumnya`
                    : "Perlu peningkatan dari sebelumnya"}
                </p>
              )}
              {i === 0 && (
                <p className="text-xs text-indigo-500 font-medium mt-1 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Supervisi terbaru
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
          <p className="text-gray-400 text-xs">{list.length} siklus · {selesaiCount} selesai</p>
        </div>
        <div className="divide-y divide-gray-100">
          {list.map((s) => {
            const isOpen = expandedId === s.id;
            const pb3 = s.predikat ? predikatBadge(s.predikat) : null;
            const sb = statusBadge(s.status);

            return (
              <div key={s.id}>
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
                        <p className="font-semibold text-gray-800 text-sm">{s.topik ?? "(tanpa topik)"}</p>
                        <Badge variant={sb.variant as BadgeVariant}>{sb.label}</Badge>
                        {pb3 && <Badge variant={pb3.variant as BadgeVariant}>{pb3.label}</Badge>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.guru ? `${s.guru} · ` : ""}{s.kelas ?? "-"} · {s.semester === "GANJIL" ? "Ganjil" : "Genap"} {s.tahunAjaran} · {fmtTanggal(s.tanggal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xl font-bold text-gray-800">
                        {s.nilaiAkhir !== null ? s.nilaiAkhir.toFixed(1) : "—"}
                      </p>
                      <p className="text-xs text-gray-400">Nilai Akhir</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

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
                            <ProgressBar key={i} value={k.nilai ?? 0} label={`${k.label}${k.nilai === null ? " (belum)" : ""}`} showLabel size="md" />
                          ))}
                        </div>

                        {s.dimensi.length > 0 && (
                          <>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-3 mt-5">Profil Dimensi (Observasi)</p>
                            <div className="space-y-2">
                              {s.dimensi.map((d, i) => (
                                <ProgressBar key={i} value={d.nilai} label={d.dimensi} showLabel />
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* RTL */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                          Rencana Tindak Lanjut ({s.rtl.length})
                        </p>
                        <div className="space-y-3">
                          {s.rtl.length === 0 && (
                            <p className="text-xs text-gray-400">Belum ada RTL pada siklus ini</p>
                          )}
                          {s.rtl.map((r) => {
                            const st = rtlStatusStyle[r.status] ?? rtlStatusStyle.BELUM;
                            return (
                              <div key={r.id} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="text-sm font-semibold text-gray-700">{r.aspek}</p>
                                  <Badge variant={st.variant}>{st.label}</Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{r.rencana}</p>
                                {r.deadline && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Deadline: {fmtTanggal(r.deadline)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Info supervisor */}
                        <div className="mt-5 p-4 bg-indigo-50 rounded-xl">
                          <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Informasi Supervisi</p>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p><span className="text-gray-400">Supervisor:</span> {s.supervisor}</p>
                            <p><span className="text-gray-400">Tanggal:</span> {fmtTanggal(s.tanggal)}</p>
                            <p><span className="text-gray-400">Kelas:</span> {s.kelas ?? "-"}</p>
                            <p><span className="text-gray-400">Mata Pelajaran:</span> {s.mapel ?? "-"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Foto dokumentasi supervisi dari supervisor */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Foto Dokumentasi Supervisi
                      </p>
                      <FotoDokumentasi siklusId={s.id} />
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
