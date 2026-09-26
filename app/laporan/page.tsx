"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { predikatBadge, BadgeVariant } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { BarChart3, Users, CheckCircle, Percent, Download, Loader2, Inbox } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import Link from "next/link";

interface RekapRow {
  id: string;
  nama: string;
  guruId: string;
  mapel: string | null;
  kelas: string | null;
  status: string;
  pra: number | null;
  observasi: number | null;
  pasca: number | null;
  nilaiAkhir: number | null;
  predikat: string | null;
}

interface LaporanData {
  rekap: RekapRow[];
  dimensiRadar: { dimensi: string; nilai: number }[];
  distribusiPredikat: { predikat: string; jumlah: number }[];
  taList: string[];
}

export default function LaporanPage() {
  const [filterTA, setFilterTA] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterTA) params.set("ta", filterTA);
      if (filterSemester) params.set("semester", filterSemester);
      const res = await fetch(`/api/laporan?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat laporan");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, [filterTA, filterSemester]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  const rekapGuru = data?.rekap ?? [];
  const selesai = rekapGuru.filter((g) => g.status === "SELESAI");
  const rataNilai = selesai.length > 0
    ? selesai.reduce((a, g) => a + (g.nilaiAkhir ?? 0), 0) / selesai.length
    : 0;
  const tertinggi = rekapGuru.reduce(
    (best, g) => ((g.nilaiAkhir ?? -1) > (best?.nilaiAkhir ?? -1) ? g : best),
    null as RekapRow | null
  );

  const stats = [
    { title: "Siklus Terdata", value: rekapGuru.length, subtitle: filterTA || "Semua tahun ajaran", icon: Users, iconBg: "primary" },
    { title: "Siklus Selesai", value: selesai.length, subtitle: "Siap direkap", icon: CheckCircle, iconBg: "success" },
    { title: "Rata-rata Nilai", value: selesai.length > 0 ? rataNilai.toFixed(1) : "—", subtitle: "Dari siklus selesai", icon: Percent, iconBg: "info" },
    {
      title: "Nilai Tertinggi",
      value: tertinggi?.nilaiAkhir != null ? tertinggi.nilaiAkhir.toFixed(1) : "—",
      subtitle: tertinggi?.nama ?? "-",
      icon: BarChart3,
      iconBg: "warning",
    },
  ];

  return (
    <DashboardLayout
      pageTitle="Rekap & Statistik"
      breadcrumbs={[{ label: "Beranda" }, { label: "Laporan" }]}
    >
      {/* Filter */}
      <div className="flex items-center justify-end gap-3 mb-6 flex-wrap">
        <select
          value={filterTA}
          onChange={(e) => setFilterTA(e.target.value)}
          className="form-select text-sm py-2 w-40"
        >
          <option value="">Semua T.A</option>
          {(data?.taList ?? []).map((ta) => (
            <option key={ta} value={ta}>{`T.A ${ta}`}</option>
          ))}
        </select>
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className="form-select text-sm py-2 w-36"
        >
          <option value="">Semua Semester</option>
          <option value="GANJIL">Semester Ganjil</option>
          <option value="GENAP">Semester Genap</option>
        </select>
        <button className="btn-primary" onClick={() => window.print()}>
          <Download className="w-4 h-4" />
          Cetak / Ekspor
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat laporan...
        </div>
      ) : rekapGuru.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-gray-700 font-semibold mb-1">Belum ada data untuk direkap</h3>
          <p className="text-gray-400 text-sm">
            Rekap akan terisi otomatis setelah ada siklus supervisi yang dibuat dan diselesaikan.
          </p>
          <Link href="/supervisor/siklus" className="btn-primary mt-4 inline-flex">Buka Daftar Siklus</Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            {stats.map((s, i) => (
              <StatCard key={i} title={s.title} value={s.value} subtitle={s.subtitle} icon={s.icon} iconBg={s.iconBg} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            <div className="card xl:col-span-2">
              <div className="card-header">
                <h3 className="text-gray-800 font-bold text-sm">Perbandingan Nilai per Tahap</h3>
                <p className="text-gray-400 text-xs">Pra Observasi vs Observasi Kelas vs Pasca Supervisi</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={rekapGuru.map((g) => ({
                      nama: g.nama.split(",")[0],
                      pra: g.pra ?? 0,
                      observasi: g.observasi ?? 0,
                      pasca: g.pasca ?? 0,
                    }))}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Bar dataKey="pra" name="Pra Observasi" fill="#11cdef" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="observasi" name="Observasi Kelas" fill="#5e72e4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pasca" name="Pasca Supervisi" fill="#fb6340" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-gray-800 font-bold text-sm">Rata-rata Dimensi</h3>
                <p className="text-gray-400 text-xs">BBM + 3M + Literasi + Numerasi</p>
              </div>
              <div className="card-body">
                {(data?.dimensiRadar.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={data?.dimensiRadar}>
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
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            {/* Distribusi predikat */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-gray-800 font-bold text-sm">Distribusi Predikat</h3>
                <p className="text-gray-400 text-xs">Sebaran predikat siklus selesai</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.distribusiPredikat} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="predikat" width={80} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Bar dataKey="jumlah" name="Jumlah Guru" fill="#2dce89" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabel rekap */}
            <div className="card xl:col-span-2">
              <div className="card-header flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800 font-bold text-sm">Rekap Nilai per Guru</h3>
                  <p className="text-gray-400 text-xs">Rincian nilai tiap tahap supervisi</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table-argon">
                  <thead>
                    <tr>
                      <th>Guru</th>
                      <th>Pra</th>
                      <th>Obs.</th>
                      <th>Pasca</th>
                      <th>Nilai Akhir</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapGuru.map((g) => {
                      const pb = g.predikat ? predikatBadge(g.predikat) : null;
                      return (
                        <tr key={g.id}>
                          <td>
                            <p className="font-medium text-gray-700 text-xs">{g.nama}</p>
                            <p className="text-gray-400 text-xs">{g.mapel ?? "-"} · {g.kelas ?? "-"}</p>
                          </td>
                          <td className="text-gray-600 text-xs font-medium">{g.pra !== null ? g.pra.toFixed(1) : "—"}</td>
                          <td className="text-gray-600 text-xs font-medium">{g.observasi !== null ? g.observasi.toFixed(1) : "—"}</td>
                          <td className="text-gray-600 text-xs font-medium">{g.pasca !== null ? g.pasca.toFixed(1) : "—"}</td>
                          <td>
                            {g.nilaiAkhir !== null ? (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-700 text-sm">{g.nilaiAkhir.toFixed(1)}</span>
                                {pb && <Badge variant={pb.variant as BadgeVariant}>{pb.label}</Badge>}
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td>
                            <Badge variant={g.status === "SELESAI" ? "success" : "warning"}>
                              {g.status === "SELESAI" ? "Selesai" : "Berjalan"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-gray-100 text-right">
                <Link href="/supervisor/siklus" className="text-xs text-argon-primary hover:underline font-medium">
                  Lihat semua siklus →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
