"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { statusBadge, predikatBadge, BadgeVariant } from "@/components/ui/Badge";
import { CheckSquare, Search, ChevronRight, ClipboardList, CalendarClock, Loader2 } from "lucide-react";
import Link from "next/link";

interface PascaRow {
  id: string;
  status: string;
  kelas: string | null;
  mapel: string | null;
  topikPembelajaran: string | null;
  guru: { nama: string };
  nilaiAkhir: number | null;
  predikat: string | null;
  pascaSelesai: boolean;
  pascaDiisi: number;
  pascaSkor: number;
  rtlTotal: number;
  rtlSelesai: number;
}

const tahapLabel: Record<string, string> = {
  DRAFT: "Belum Dibuka",
  PRA_OBSERVASI: "Belum Dibuka",
  OBSERVASI: "Belum Dibuka",
  PASCA_SUPERVISI: "Sedang Diisi",
  SELESAI: "Selesai",
};

const INDICATOR_TOTAL = 27;

export default function PascaListPage() {
  const [search, setSearch] = useState("");
  const [filterTahap, setFilterTahap] = useState("");
  const [list, setList] = useState<PascaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/siklus");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data");
      setList(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filtered = list.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.guru.nama.toLowerCase().includes(q) ||
      (s.mapel ?? "").toLowerCase().includes(q) ||
      (s.kelas ?? "").toLowerCase().includes(q);
    const matchFilter = filterTahap
      ? filterTahap === "AKTIF"
        ? s.status === "PASCA_SUPERVISI"
        : s.status === filterTahap
      : true;
    return matchSearch && matchFilter;
  });

  const stats = [
    { label: "Total Pasca Supervisi", value: list.length },
    { label: "Sedang Diisi", value: list.filter((s) => s.status === "PASCA_SUPERVISI").length },
    { label: "Selesai", value: list.filter((s) => s.status === "SELESAI").length },
    { label: "RTL Aktif", value: list.reduce((a, s) => a + (s.rtlTotal - s.rtlSelesai), 0) },
  ];

  return (
    <DashboardLayout
      pageTitle="Pasca Supervisi"
      breadcrumbs={[{ label: "Supervisor" }, { label: "Pasca Supervisi" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-gray-800 font-bold text-sm">Dialog & RTL per Siklus</h3>
            <p className="text-gray-400 text-xs">27 indikator · 5 komponen (3M, BBM, Asesmen, Refleksi) + Rencana Tindak Lanjut</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterTahap}
              onChange={(e) => setFilterTahap(e.target.value)}
              className="form-select text-sm py-2 w-44"
            >
              <option value="">Semua Tahap</option>
              <option value="AKTIF">Sedang Diisi</option>
              <option value="SELESAI">Selesai</option>
            </select>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari guru / kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-36 text-gray-600 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
        )}

        <div className="p-5 grid grid-cols-1 gap-4">
          {loading && (
            <div className="text-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" /> Memuat data...
            </div>
          )}
          {!loading &&
            filtered.map((s) => {
              const sb = statusBadge(s.status);
              const pb = s.predikat ? predikatBadge(s.predikat) : null;
              const diisi = s.pascaDiisi;
              const progress = (diisi / INDICATOR_TOTAL) * 100;
              const tahap = tahapLabel[s.status] ?? "-";
              const rtlSelesai = s.rtlSelesai >= s.rtlTotal;
              const belumDibuka = ["DRAFT", "PRA_OBSERVASI", "OBSERVASI"].includes(s.status);

              return (
                <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-gray-800 font-semibold text-sm">{s.guru.nama}</h4>
                        <Badge variant={sb.variant as BadgeVariant}>{sb.label}</Badge>
                        <Badge variant="info">{tahap}</Badge>
                        {pb && <Badge variant={pb.variant as BadgeVariant}>{pb.label}</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {s.mapel ?? "-"} · {s.kelas ?? "-"}
                        {s.topikPembelajaran ? ` · "${s.topikPembelajaran}"` : ""}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        Dialog pasca supervisi
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {s.nilaiAkhir !== null && s.pascaSelesai ? (
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{s.nilaiAkhir.toFixed(1)}</p>
                          <p className="text-xs text-gray-400">Nilai Akhir</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-gray-800">
                            {diisi}<span className="text-sm text-gray-400">/{INDICATOR_TOTAL}</span>
                          </p>
                          <p className="text-xs text-gray-400">indikator terisi</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress + RTL */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progress pengisian</span>
                        <span className="font-medium text-gray-500">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${progress}%`,
                            background: progress >= 100
                              ? "linear-gradient(87deg, #2dce89 0, #2dcecc 100%)"
                              : "linear-gradient(87deg, #fb6340 0, #fbb140 100%)",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">RTL tuntas</span>
                        <span className="font-medium text-gray-500">{s.rtlSelesai}/{s.rtlTotal}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${s.rtlTotal > 0 ? (s.rtlSelesai / s.rtlTotal) * 100 : 0}%`,
                            background: rtlSelesai
                              ? "linear-gradient(87deg, #2dce89 0, #2dcecc 100%)"
                              : "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Link
                      href={`/supervisor/pasca/${s.id}`}
                      className={`btn-sm ${belumDibuka ? "btn bg-gray-100 text-gray-400 hover:bg-gray-200" : "btn-warning"}`}
                    >
                      {s.pascaSelesai ? "Lihat Hasil" : diisi === 0 ? (belumDibuka ? "Belum Dibuka" : "Mulai Pengisian") : "Lanjutkan"}
                    </Link>
                    <Link href={`/supervisor/siklus/${s.id}`} className="btn bg-gray-100 text-gray-600 btn-sm hover:bg-gray-200">
                      <span>Detail Siklus</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">
                {list.length === 0 ? "Belum ada siklus supervisi — buat siklus terlebih dahulu" : "Tidak ada data pasca supervisi ditemukan"}
              </p>
              <Link href="/supervisor/siklus" className="btn-primary mt-4 inline-flex">
                Buka Daftar Siklus
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
