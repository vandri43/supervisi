"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { komponenPraObservasi, pertanyaanKonferensi, hitungNilaiPra, SKOR_MAKS_PRA } from "@/lib/instrumen/pra-observasi";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { Save, ChevronDown, ChevronUp, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

const skorLabel: Record<number, { label: string; color: string }> = {
  0: { label: "Belum diisi", color: "bg-gray-100 text-gray-400" },
  1: { label: "Belum Terlihat", color: "bg-red-100 text-red-600" },
  2: { label: "Mulai Berkembang", color: "bg-orange-100 text-orange-600" },
  3: { label: "Baik", color: "bg-blue-100 text-blue-600" },
  4: { label: "Sangat Baik", color: "bg-green-100 text-green-600" },
};

type SkorMap = Record<string, number>;
type KonferensiMap = Record<number, string>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PraObservasiPage(_props: { params: { id: string } }) {
  const router = useRouter();
  const [openKomponen, setOpenKomponen] = useState<string>("A");
  const [skor, setSkor] = useState<SkorMap>({});
  const [catatan, setCatatan] = useState<Record<string, string>>({});
  const [konferensi, setKonferensi] = useState<KonferensiMap>({});
  const [activeTab, setActiveTab] = useState<"instrumen" | "konferensi">("instrumen");

  const totalSkor = Object.values(skor).reduce((a, b) => a + b, 0);
  const totalIndikator = komponenPraObservasi.reduce((a, k) => a + k.indikator.length, 0);
  const diisi = Object.values(skor).filter((v) => v > 0).length;
  const { nilaiAkhir, predikat } = hitungNilaiPra(totalSkor);

  function setSkorIndikator(key: string, val: number) {
    setSkor((prev) => ({ ...prev, [key]: val }));
  }

  function getSkorKomponen(kode: string) {
    const k = komponenPraObservasi.find((k) => k.kode === kode);
    if (!k) return { total: 0, maks: 0 };
    const total = k.indikator.reduce((a, ind) => a + (skor[`${kode}-${ind.no}`] ?? 0), 0);
    const maks = k.indikator.length * 4;
    return { total, maks };
  }

  return (
    <DashboardLayout
      pageTitle="Pra Observasi — Telaah RPP/RPM"
      breadcrumbs={[
        { label: "Supervisor" },
        { label: "Siklus", href: "/supervisor/siklus" },
        { label: "Pra Observasi" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <Link href="/supervisor/siklus" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke siklus
        </Link>

        {/* Header info guru */}
        <div className="card mb-5">
          <div className="card-body flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Guru yang disupervisi</p>
              <p className="font-bold text-gray-800">Siti Rahayu, S.Pd</p>
              <p className="text-xs text-gray-500">DKV · X-DKV-1 · SMKN 1 Contoh · Semester Ganjil 2025/2026</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Progress Pengisian</p>
              <p className="text-2xl font-bold text-indigo-600">{diisi}/{totalIndikator}</p>
              <p className="text-xs text-gray-400">indikator terisi</p>
            </div>
          </div>
          <div className="px-6 pb-4">
            <ProgressBar value={(diisi / totalIndikator) * 100} showLabel size="md" />
          </div>
        </div>

        {/* Score summary */}
        {diisi > 0 && (
          <div
            className="rounded-xl p-4 mb-5 text-white flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
          >
            <div>
              <p className="text-white/70 text-sm">Total Skor Sementara</p>
              <p className="text-3xl font-bold">{totalSkor} <span className="text-lg font-normal opacity-60">/ {SKOR_MAKS_PRA}</span></p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Nilai Sementara</p>
              <p className="text-3xl font-bold">{nilaiAkhir.toFixed(1)}</p>
              <Badge variant={
                predikat === "SANGAT_BAIK" ? "success" :
                predikat === "BAIK" ? "primary" :
                predikat === "CUKUP" ? "warning" : "danger"
              } className="bg-white/20 text-white">
                {predikat.replace("_", " ")}
              </Badge>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
          {(["instrumen", "konferensi"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "instrumen" ? "Instrumen (45 Indikator)" : "Konferensi Pra-Observasi"}
            </button>
          ))}
        </div>

        {/* Instrumen Tab */}
        {activeTab === "instrumen" && (
          <div className="space-y-3">
            {komponenPraObservasi.map((k) => {
              const { total, maks } = getSkorKomponen(k.kode);
              const isOpen = openKomponen === k.kode;
              return (
                <div key={k.kode} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenKomponen(isOpen ? "" : k.kode)}
                    className="w-full card-header flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {k.kode}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{k.judul}</p>
                        <p className="text-xs text-gray-400">{k.indikator.length} indikator · Skor {total}/{maks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {maks > 0 && (
                        <div className="w-20">
                          <ProgressBar value={(total / maks) * 100} />
                        </div>
                      )}
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-gray-50">
                      {k.indikator.map((ind) => {
                        const key = `${k.kode}-${ind.no}`;
                        const val = skor[key] ?? 0;
                        return (
                          <div key={key} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start gap-3 mb-3">
                              <span className="text-xs font-bold text-gray-400 flex-shrink-0 mt-0.5">
                                {k.kode}{ind.no}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">{ind.deskripsi}</p>
                                {ind.tagPM && (
                                  <Badge variant="info" className="mt-1">{ind.tagPM}</Badge>
                                )}
                              </div>
                            </div>
                            {/* Skor buttons */}
                            <div className="flex items-center gap-2 ml-8 flex-wrap">
                              {[1, 2, 3, 4].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setSkorIndikator(key, val === s ? 0 : s)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    val === s
                                      ? s === 1 ? "bg-red-500 border-red-500 text-white"
                                        : s === 2 ? "bg-orange-500 border-orange-500 text-white"
                                        : s === 3 ? "bg-blue-500 border-blue-500 text-white"
                                        : "bg-green-500 border-green-500 text-white"
                                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                                  }`}
                                >
                                  {s} — {skorLabel[s].label}
                                </button>
                              ))}
                            </div>
                            {/* Catatan */}
                            <div className="ml-8 mt-2">
                              <input
                                type="text"
                                placeholder="Catatan (opsional)..."
                                value={catatan[key] ?? ""}
                                onChange={(e) => setCatatan((prev) => ({ ...prev, [key]: e.target.value }))}
                                className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-300 text-gray-600 placeholder-gray-300"
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
        )}

        {/* Konferensi Tab */}
        {activeTab === "konferensi" && (
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              <div>
                <h3 className="text-gray-800 font-bold text-sm">Pertanyaan Konferensi Pra-Observasi</h3>
                <p className="text-gray-400 text-xs">Catat jawaban guru saat konferensi pra-observasi</p>
              </div>
            </div>
            <div className="card-body space-y-5">
              {pertanyaanKonferensi.map((pertanyaan, i) => (
                <div key={i}>
                  <label className="form-label">Pertanyaan {i + 1}</label>
                  <p className="text-sm text-gray-700 mb-2 font-medium">{pertanyaan}</p>
                  <textarea
                    rows={3}
                    className="form-input text-sm"
                    placeholder="Jawaban guru..."
                    value={konferensi[i] ?? ""}
                    onChange={(e) => setKonferensi((prev) => ({ ...prev, [i]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save buttons */}
        <div className="sticky bottom-4 mt-6 flex justify-end gap-3">
          <div className="card px-6 py-3 flex items-center gap-3 shadow-lg">
            <div className="text-sm text-gray-500">
              <span className="font-bold text-gray-700">{diisi}</span>/{totalIndikator} indikator diisi
            </div>
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
              Selesai & Lanjut Observasi
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
