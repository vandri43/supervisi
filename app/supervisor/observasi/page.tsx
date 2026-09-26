"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { statusBadge, predikatBadge, BadgeVariant } from "@/components/ui/Badge";
import { Eye, Search, ChevronRight, ClipboardList, Loader2 } from "lucide-react";
import Link from "next/link";

interface ObsRow {
  id: string;
  status: string;
  kelas: string | null;
  mapel: string | null;
  topikPembelajaran: string | null;
  guru: { nama: string };
  predikat: string | null;
  obsSelesai: boolean;
  obsDiisi: number;
  obsSkor: number;
}

const tahapLabel: Record<string, string> = {
  DRAFT: "Belum Dibuka",
  PRA_OBSERVASI: "Belum Dibuka",
  OBSERVASI: "Sedang Diisi",
  PASCA_SUPERVISI: "Selesai",
  SELESAI: "Selesai",
};

const INDICATOR_TOTAL = 44;

export default function ObservasiListPage() {
  const [search, setSearch] = useState("");
  const [filterTahap, setFilterTahap] = useState("");
  const [list, setList] = useState<ObsRow[]>([]);
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
        ? s.status === "OBSERVASI"
        : s.status === filterTahap
      : true;
    return matchSearch && matchFilter;
  });

  const stats = [
    { label: "Total Observasi Kelas", value: list.length },
    { label: "Sedang Diisi", value: list.filter((s) => s.status === "OBSERVASI").length },
    { label: "Selesai", value: list.filter((s) => ["PASCA_SUPERVISI", "SELESAI"].includes(s.status)).length },
    { label: "Belum Dibuka", value: list.filter((s) => ["DRAFT", "PRA_OBSERVASI"].includes(s.status)).length },
  ];

  return (
    <DashboardLayout
      pageTitle="Observasi Kelas"
      breadcrumbs={[{ label: "Supervisor" }, { label: "Observasi Kelas" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
              <Eye className="w-5 h-5" />
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
            <h3 className="text-gray-800 font-bold text-sm">Observasi Kelas per Siklus</h3>
            <p className="text-gray-400 text-xs">44 indikator · 6 komponen · skor maks 176 · dimensi BBM + 3M + Literasi + Numerasi</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterTahap}
              onChange={(e) => setFilterTahap(e.target.value)}
              className="form-select text-sm py-2 w-44"
            >
              <option value="">Semua Tahap</option>
              <option value="AKTIF">Sedang Diisi</option>
              <option value="PASCA_SUPERVISI">Selesai</option>
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
              const diisi = s.obsDiisi;
              const skor = s.obsSkor;
              const progress = (diisi / INDICATOR_TOTAL) * 100;
              const tahap = tahapLabel[s.status] ?? "-";
              const belumDibuka = ["DRAFT", "PRA_OBSERVASI"].includes(s.status);

              return (
                <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:border-green-200 hover:shadow-sm transition-all">
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
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-gray-800">
                        {diisi}<span className="text-sm text-gray-400">/{INDICATOR_TOTAL}</span>
                      </p>
                      <p className="text-xs text-gray-400">indikator terisi</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
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
                            : "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)",
                        }}
                      />
                    </div>
                    {skor > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Skor sementara: <span className="font-semibold text-gray-600">{skor}/176</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Link
                      href={`/supervisor/observasi/${s.id}`}
                      className={`btn-sm ${belumDibuka ? "btn bg-gray-100 text-gray-400 hover:bg-gray-200" : "btn-primary"}`}
                    >
                      {diisi === 0 ? (belumDibuka ? "Belum Dibuka" : "Mulai Pengisian") : diisi < INDICATOR_TOTAL ? "Lanjutkan" : "Lihat Hasil"}
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
                {list.length === 0 ? "Belum ada siklus supervisi — buat siklus terlebih dahulu" : "Tidak ada data observasi kelas ditemukan"}
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
