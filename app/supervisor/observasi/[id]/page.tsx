"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FotoDokumentasi from "@/components/FotoDokumentasi";
import type { KomponenDb } from "@/lib/instrumen-db";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { Save, ChevronDown, ChevronUp, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Camera } from "lucide-react";
import Link from "next/link";

const skorLabel: Record<number, { label: string }> = {
  0: { label: "Belum diisi" },
  1: { label: "Belum Terlihat" },
  2: { label: "Mulai Berkembang" },
  3: { label: "Baik" },
  4: { label: "Sangat Baik" },
};

type SkorMap = Record<string, number>;
type CatatanMap = Record<string, string>;

export default function ObservasiKelasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [openKomponen, setOpenKomponen] = useState<Record<string, boolean>>({});
  const [skor, setSkor] = useState<SkorMap>({});
  const [catatan, setCatatan] = useState<CatatanMap>({});
  const [catatanUmum, setCatatanUmum] = useState("");
  const [info, setInfo] = useState<{ nama: string; mapel: string | null; kelas: string | null; sekolah: string; topik: string | null } | null>(null);
  const [komponen, setKomponen] = useState<KomponenDb[]>([]);
  const [skorMaksStage, setSkorMaksStage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const fetchStage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/siklus/${id}/observasi`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data");
      setInfo({
        nama: json.siklus.guru.nama,
        mapel: json.siklus.mapel,
        kelas: json.siklus.kelas,
        sekolah: json.siklus.sekolah?.nama ?? "-",
        topik: json.siklus.topikPembelajaran,
      });
      const s: SkorMap = {};
      const c: CatatanMap = {};
      for (const i of json.indikator) {
        s[i.key] = i.skor;
        if (i.catatan) c[i.key] = i.catatan;
      }
      setSkor(s);
      setCatatan(c);
      setCatatanUmum(json.catatanUmum ?? "");
      setKomponen(json.instrumen ?? []);
      setSkorMaksStage(json.skorMaks ?? 0);
      // buka komponen pertama yang belum terisi
      const instr: KomponenDb[] = json.instrumen ?? [];
      const firstEmpty = instr.find((k) => k.indikator.some((ind) => !s[`${k.kode}-${ind.no}`]));
      setOpenKomponen({ [firstEmpty?.kode ?? instr[0]?.kode ?? ""]: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStage();
  }, [fetchStage]);

  const totalSkor = Object.values(skor).reduce((a, b) => a + b, 0);
  const totalIndikator = komponen.reduce((a, k) => a + k.indikator.length, 0);
  const diisi = Object.values(skor).filter((v) => v > 0).length;
  const nilaiAkhir = skorMaksStage > 0 ? (totalSkor / skorMaksStage) * 100 : 0;
  const predikat =
    nilaiAkhir >= 91 ? "SANGAT_BAIK" : nilaiAkhir >= 81 ? "BAIK" : nilaiAkhir >= 71 ? "CUKUP" : "KURANG";

  function setSkorIndikator(key: string, val: number) {
    setSkor((prev) => ({ ...prev, [key]: val }));
    setSavedMsg("");
  }

  function getSkorKomponen(kode: string) {
    const k = komponen.find((k) => k.kode === kode);
    if (!k) return { total: 0, maks: 0 };
    const total = k.indikator.reduce((a, ind) => a + (skor[`${kode}-${ind.no}`] ?? 0), 0);
    const maks = k.indikator.length * 4;
    return { total, maks };
  }

  async function handleSave(selesai: boolean) {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const indikator = Object.entries(skor).map(([key, v]) => ({
        key,
        skor: v,
        catatan: catatan[key] ?? "",
      }));
      const res = await fetch(`/api/siklus/${id}/observasi`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indikator, catatanUmum, selesai }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      setSavedMsg(selesai ? "Tersimpan! Siklus lanjut ke Pasca Supervisi." : "Draft tersimpan.");
      if (selesai) {
        setTimeout(() => router.push(`/supervisor/pasca/${id}`), 1200);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Observasi Kelas" breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: "Observasi" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat instrumen...
        </div>
      </DashboardLayout>
    );
  }

  if (error && !info) {
    return (
      <DashboardLayout pageTitle="Observasi Kelas" breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: "Observasi" }]}>
        <div className="max-w-lg mx-auto card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link href="/supervisor/siklus" className="btn-primary inline-flex"><ArrowLeft className="w-4 h-4" /> Kembali</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Observasi Kelas"
      breadcrumbs={[
        { label: "Supervisor" },
        { label: "Siklus", href: "/supervisor/siklus" },
        { label: info?.nama ?? "Observasi" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <Link href={`/supervisor/siklus/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke detail siklus
        </Link>

        {/* Header */}
        <div className="card mb-5">
          <div className="card-body flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Guru yang diobservasi</p>
              <p className="font-bold text-gray-800">{info?.nama}</p>
              <p className="text-xs text-gray-500">
                {info?.mapel ?? "-"} · {info?.kelas ?? "-"} · {info?.sekolah}
                {info?.topik ? ` · Topik: ${info.topik}` : ""}
              </p>
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

        {/* Dokumentasi foto observasi kelas — bukti otentik pelaksanaan */}
        <div className="card mb-5">
          <div className="card-header flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-green-600" /> Dokumentasi Observasi
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">
                Foto kegiatan saat observasi kelas sebagai bukti otentik pelaksanaan supervisi
              </p>
            </div>
          </div>
          <div className="p-5 pt-0">
            <FotoDokumentasi siklusId={id} bisaKelola />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 mb-5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {savedMsg && (
          <div className="flex items-center gap-2 px-4 py-3 mb-5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {savedMsg}
          </div>
        )}

        {/* Score summary */}
        {diisi > 0 && (
          <div
            className="rounded-xl p-4 mb-5 text-white flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "linear-gradient(87deg, #2dce89 0, #2dcecc 100%)" }}
          >
            <div>
              <p className="text-white/70 text-sm">Total Skor Sementara</p>
              <p className="text-3xl font-bold">{totalSkor} <span className="text-lg font-normal opacity-60">/ {skorMaksStage}</span></p>
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

        {/* Instrumen */}
        <div className="space-y-3">
          {komponen.map((k) => {
            const { total, maks } = getSkorKomponen(k.kode);
            const isOpen = !!openKomponen[k.kode];
            return (
              <div key={k.kode} className="card overflow-hidden">
                <button
                  onClick={() => setOpenKomponen((prev) => ({ ...prev, [k.kode]: !prev[k.kode] }))}
                  className="w-full card-header flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
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
                        <ProgressBar value={(total / maks) * 100} color="success" />
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
                              {"dimensi" in ind && (ind as { dimensi?: string }).dimensi && (
                                <Badge variant="info" className="mt-1">{(ind as { dimensi?: string }).dimensi}</Badge>
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

          {/* Catatan umum */}
          <div className="card">
            <div className="card-body">
              <label className="form-label">Catatan Umum Observasi</label>
              <textarea
                rows={3}
                className="form-input text-sm"
                placeholder="Catatan umum selama observasi kelas..."
                value={catatanUmum}
                onChange={(e) => setCatatanUmum(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Save buttons */}
        <div className="sticky bottom-4 mt-6 flex justify-end gap-3">
          <div className="card px-6 py-3 flex items-center gap-3 shadow-lg">
            <div className="text-sm text-gray-500">
              <span className="font-bold text-gray-700">{diisi}</span>/{totalIndikator} indikator diisi
            </div>
            <button
              className="btn bg-gray-100 text-gray-600 hover:bg-gray-200"
              disabled={saving}
              onClick={() => handleSave(false)}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Simpan Draft
            </button>
            <button
              disabled={saving}
              className="btn-success"
              onClick={() => handleSave(true)}
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
