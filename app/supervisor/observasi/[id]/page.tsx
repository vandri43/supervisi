"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { komponenObservasi, hitungNilaiObservasi, SKOR_MAKS_OBSERVASI } from "@/lib/instrumen/observasi-kelas";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { Save, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

const dimensiColors: Record<string, string> = {
  BBM: "bg-purple-100 text-purple-700",
  "3M": "bg-blue-100 text-blue-700",
  Literasi: "bg-teal-100 text-teal-700",
  Numerasi: "bg-green-100 text-green-700",
  Asesmen: "bg-orange-100 text-orange-700",
  Umum: "bg-gray-100 text-gray-600",
};

type SkorMap = Record<string, number>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ObservasiKelasPage(_props: { params: { id: string } }) {
  const router = useRouter();
  const [openKomponen, setOpenKomponen] = useState<string>("A");
  const [skor, setSkor] = useState<SkorMap>({});
  const [catatan, setCatatan] = useState<Record<string, string>>({});
  const [catatanUmum, setCatatanUmum] = useState("");

  const totalIndikator = komponenObservasi.reduce((a, k) => a + k.indikator.length, 0);
  const diisi = Object.values(skor).filter((v) => v > 0).length;
  const totalSkor = Object.values(skor).reduce((a, b) => a + b, 0);
  const { nilaiAkhir, predikat } = hitungNilaiObservasi(totalSkor);

  function getSkorKomponen(kode: string) {
    const k = komponenObservasi.find((k) => k.kode === kode);
    if (!k) return { total: 0, maks: 0 };
    const total = k.indikator.reduce((a, ind) => a + (skor[`${kode}-${ind.no}`] ?? 0), 0);
    const maks = k.indikator.length * 4;
    return { total, maks };
  }

  // Rekap per dimensi
  const dimensiStats: Record<string, { total: number; maks: number }> = {};
  komponenObservasi.forEach((k) => {
    k.indikator.forEach((ind) => {
      const d = ind.dimensi;
      if (!dimensiStats[d]) dimensiStats[d] = { total: 0, maks: 0 };
      dimensiStats[d].total += skor[`${k.kode}-${ind.no}`] ?? 0;
      dimensiStats[d].maks += 4;
    });
  });

  return (
    <DashboardLayout
      pageTitle="Observasi Kelas"
      breadcrumbs={[
        { label: "Supervisor" },
        { label: "Siklus", href: "/supervisor/siklus" },
        { label: "Observasi Kelas" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <Link href="/supervisor/siklus" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke siklus
        </Link>

        {/* Header */}
        <div className="card mb-5">
          <div className="card-body flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Guru yang diobservasi</p>
              <p className="font-bold text-gray-800">Siti Rahayu, S.Pd</p>
              <p className="text-xs text-gray-500">DKV · X-DKV-1 · Topik: Desain Poster Digital</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Progress</p>
              <p className="text-2xl font-bold text-indigo-600">{diisi}/{totalIndikator}</p>
            </div>
          </div>
          <div className="px-6 pb-4">
            <ProgressBar value={(diisi / totalIndikator) * 100} showLabel size="md" />
          </div>
        </div>

        {/* Score summary + dimensi rekap */}
        {diisi > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
            <div
              className="rounded-xl p-5 text-white"
              style={{ background: "linear-gradient(87deg, #2dce89 0, #2dcecc 100%)" }}
            >
              <p className="text-white/70 text-sm mb-1">Skor & Nilai Sementara</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-4xl font-bold">{nilaiAkhir.toFixed(1)}</p>
                  <p className="text-white/60 text-xs">dari {SKOR_MAKS_OBSERVASI} skor maks</p>
                </div>
                <Badge variant={
                  predikat === "SANGAT_BAIK" ? "success" :
                  predikat === "BAIK" ? "primary" :
                  predikat === "CUKUP" ? "warning" : "danger"
                } className="bg-white/20 text-white mb-1">
                  {predikat.replace("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Rekap Per Dimensi</p>
                <div className="space-y-2">
                  {Object.entries(dimensiStats).slice(0, 5).map(([dim, stat]) => (
                    <div key={dim}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${dimensiColors[dim] ?? "bg-gray-100 text-gray-600"}`}>{dim}</span>
                        <span className="text-gray-500 font-medium">{stat.maks > 0 ? ((stat.total / stat.maks) * 100).toFixed(0) : 0}%</span>
                      </div>
                      <ProgressBar value={stat.maks > 0 ? (stat.total / stat.maks) * 100 : 0} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instrumen per komponen */}
        <div className="space-y-3 mb-5">
          {komponenObservasi.map((k) => {
            const { total, maks } = getSkorKomponen(k.kode);
            const isOpen = openKomponen === k.kode;
            return (
              <div key={k.kode} className="card overflow-hidden">
                <button
                  onClick={() => setOpenKomponen(isOpen ? "" : k.kode)}
                  className="w-full card-header flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {k.kode}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{k.judul}</p>
                      <p className="text-xs text-gray-400">{k.indikator.length} indikator · Skor {total}/{maks}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {maks > 0 && <div className="w-20"><ProgressBar value={(total / maks) * 100} color="success" /></div>}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="divide-y divide-gray-50">
                    {k.indikator.map((ind) => {
                      const key = `${k.kode}-${ind.no}`;
                      const val = skor[key] ?? 0;
                      return (
                        <div key={key} className="px-6 py-4">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-xs font-bold text-gray-400 flex-shrink-0 mt-0.5">{k.kode}{ind.no}</span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{ind.deskripsi}</p>
                              <Badge className={`mt-1 ${dimensiColors[ind.dimensi]}`}>{ind.dimensi}</Badge>
                            </div>
                          </div>
                          {/* Skor */}
                          <div className="flex items-center gap-2 ml-8 flex-wrap">
                            {[1, 2, 3, 4].map((s) => (
                              <button
                                key={s}
                                onClick={() => setSkor((prev) => ({ ...prev, [key]: val === s ? 0 : s }))}
                                className={`w-8 h-8 rounded-full text-sm font-bold border-2 transition-all ${
                                  val === s
                                    ? s === 1 ? "bg-red-500 border-red-500 text-white"
                                      : s === 2 ? "bg-orange-500 border-orange-500 text-white"
                                      : s === 3 ? "bg-blue-500 border-blue-500 text-white"
                                      : "bg-green-500 border-green-500 text-white"
                                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                            <span className="text-xs text-gray-400 ml-1">
                              {val > 0 ? ["", "Belum Terlihat", "Mulai Berkembang", "Baik", "Sangat Baik"][val] : "Belum diisi"}
                            </span>
                          </div>
                          <div className="ml-8 mt-2">
                            <input
                              type="text"
                              placeholder="Catatan observasi (opsional)..."
                              value={catatan[key] ?? ""}
                              onChange={(e) => setCatatan((prev) => ({ ...prev, [key]: e.target.value }))}
                              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-green-300 text-gray-600 placeholder-gray-300"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Catatan umum */}
        <div className="card mb-5">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm">Catatan Umum Observasi</h3>
          </div>
          <div className="card-body">
            <textarea
              rows={4}
              className="form-input"
              placeholder="Tuliskan catatan umum hasil observasi kelas..."
              value={catatanUmum}
              onChange={(e) => setCatatanUmum(e.target.value)}
            />
          </div>
        </div>

        {/* Sticky save */}
        <div className="sticky bottom-4 flex justify-end gap-3">
          <div className="card px-6 py-3 flex items-center gap-3 shadow-lg">
            <span className="text-sm text-gray-500">
              <strong className="text-gray-700">{diisi}</strong>/{totalIndikator} diisi
            </span>
            <button
              className="btn bg-gray-100 text-gray-600 hover:bg-gray-200"
              onClick={() => router.push("/supervisor/siklus")}
            >
              Simpan Draft
            </button>
            <button
              disabled={diisi < totalIndikator}
              className="btn-success"
              onClick={() => router.push("/supervisor/siklus")}
            >
              <Save className="w-4 h-4" />
              Selesai & Lanjut Pasca Supervisi
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
