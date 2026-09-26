"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { Save, ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { KomponenDb } from "@/lib/instrumen-db";

type SkorMap = Record<string, number>;
type CatatanMap = Record<string, string>;

interface RTLItem {
  aspek: string;
  temuan: string;
  rencana: string;
  target: string;
  deadline: string;
  statusMonitoring?: string;
}

export default function PascaSupervisiPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [openKomponen, setOpenKomponen] = useState<Record<string, boolean>>({ "3M": true });
  const [skor, setSkor] = useState<SkorMap>({});
  const [catatan, setCatatan] = useState<CatatanMap>({});
  const [catatanUmum, setCatatanUmum] = useState("");
  const [rtlItems, setRtlItems] = useState<RTLItem[]>([{ aspek: "", temuan: "", rencana: "", target: "", deadline: "" }]);
  const [info, setInfo] = useState<{ nama: string; mapel: string | null; kelas: string | null; topik: string | null } | null>(null);
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
      const res = await fetch(`/api/siklus/${id}/pasca`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data");
      setInfo({
        nama: json.siklus.guru.nama,
        mapel: json.siklus.mapel,
        kelas: json.siklus.kelas,
        topik: json.siklus.topikPembelajaran,
      });
      setKomponen(json.instrumen ?? []);
      setSkorMaksStage(json.skorMaks ?? 0);
      const s: SkorMap = {};
      const c: CatatanMap = {};
      for (const i of json.indikator) {
        s[i.key] = i.skor;
        if (i.catatan) c[i.key] = i.catatan;
      }
      setSkor(s);
      setCatatan(c);
      setCatatanUmum(json.catatanUmum ?? "");
      if (Array.isArray(json.rtl) && json.rtl.length > 0) {
        setRtlItems(
          json.rtl.map((r: { aspek: string; temuan: string | null; rencana: string; target: string | null; deadline: string | null; statusMonitoring: string }) => ({
            aspek: r.aspek,
            temuan: r.temuan ?? "",
            rencana: r.rencana ?? "",
            target: r.target ?? "",
            deadline: r.deadline ? r.deadline.slice(0, 10) : "",
            statusMonitoring: r.statusMonitoring,
          }))
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStage();
  }, [fetchStage]);

  const totalIndikator = komponen.reduce((a, k) => a + k.indikator.length, 0);
  const diisi = Object.values(skor).filter((v) => v > 0).length;
  const totalSkor = Object.values(skor).reduce((a, b) => a + b, 0);
  const nilaiAkhir = skorMaksStage > 0 ? (totalSkor / skorMaksStage) * 100 : 0;

  function getPredikat(nilai: number) {
    if (nilai >= 91) return { label: "Sangat Baik", variant: "success" as const, kode: "SANGAT_BAIK" as const };
    if (nilai >= 81) return { label: "Baik", variant: "primary" as const, kode: "BAIK" as const };
    if (nilai >= 71) return { label: "Cukup", variant: "warning" as const, kode: "CUKUP" as const };
    return { label: "Kurang", variant: "danger" as const, kode: "KURANG" as const };
  }

  function setSkorIndikator(key: string, val: number) {
    setSkor((prev) => ({ ...prev, [key]: val }));
    setSavedMsg("");
  }

  function getSkorKomponen(kode: string) {
    const k = komponen.find((k) => k.kode === kode);
    if (!k) return { total: 0, maks: 0 };
    const total = k.indikator.reduce((a, ind) => a + (skor[`${kode}-${ind.no}`] ?? 0), 0);
    return { total, maks: k.indikator.length * 4 };
  }

  function addRTL() {
    setRtlItems((prev) => [...prev, { aspek: "", temuan: "", rencana: "", target: "", deadline: "" }]);
  }

  function removeRTL(index: number) {
    setRtlItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRTL(index: number, field: keyof RTLItem, value: string) {
    setRtlItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
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
      const rtl = rtlItems
        .filter((r) => r.aspek.trim() !== "")
        .map((r) => ({ ...r, statusMonitoring: r.statusMonitoring === "SELESAI" ? "SELESAI" : r.statusMonitoring === "PROSES" ? "PROSES" : "BELUM" }));
      const res = await fetch(`/api/siklus/${id}/pasca`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indikator, rtl, catatanUmum, selesai }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      setSavedMsg(selesai ? "Tersimpan! Siklus supervisi selesai." : "Draft tersimpan.");
      if (selesai) {
        setTimeout(() => router.push(`/supervisor/siklus/${id}`), 1200);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const predikat = getPredikat(nilaiAkhir);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Pasca Supervisi" breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: "Pasca" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat instrumen...
        </div>
      </DashboardLayout>
    );
  }

  if (error && !info) {
    return (
      <DashboardLayout pageTitle="Pasca Supervisi" breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: "Pasca" }]}>
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
      pageTitle="Pasca Supervisi"
      breadcrumbs={[
        { label: "Supervisor" },
        { label: "Siklus", href: "/supervisor/siklus" },
        { label: info?.nama ?? "Pasca Supervisi" },
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
              <p className="text-xs text-gray-400 mb-0.5">Guru yang disupervisi</p>
              <p className="font-bold text-gray-800">{info?.nama}</p>
              <p className="text-xs text-gray-500">
                {info?.mapel ?? "-"} · {info?.kelas ?? "-"}
                {info?.topik ? ` · Topik: ${info.topik}` : ""}
              </p>
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

        {/* Nilai sementara */}
        {diisi > 0 && (
          <div
            className="rounded-xl p-5 mb-5 text-white flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "linear-gradient(87deg, #fb6340 0, #fbb140 100%)" }}
          >
            <div>
              <p className="text-white/70 text-sm">Total Skor</p>
              <p className="text-4xl font-bold">{totalSkor} <span className="text-lg opacity-60">/ {skorMaksStage}</span></p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Nilai Akhir</p>
              <p className="text-4xl font-bold">{nilaiAkhir.toFixed(1)}</p>
              <Badge variant={predikat.variant} className="bg-white/20 text-white">{predikat.label}</Badge>
            </div>
          </div>
        )}

        {/* Instrumen */}
        <div className="space-y-3 mb-5">
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
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {k.kode}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{k.judul}</p>
                      <p className="text-xs text-gray-400">{k.indikator.length} indikator · {total}/{maks}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {maks > 0 && <div className="w-20"><ProgressBar value={(total / maks) * 100} color="warning" /></div>}
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
                            <p className="text-sm text-gray-700 flex-1">{ind.deskripsi}</p>
                          </div>
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
                                {s}
                              </button>
                            ))}
                          </div>
                          <div className="ml-8 mt-2">
                            <input
                              type="text"
                              placeholder="Catatan (opsional)..."
                              value={catatan[key] ?? ""}
                              onChange={(e) => setCatatan((prev) => ({ ...prev, [key]: e.target.value }))}
                              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-orange-300 text-gray-600 placeholder-gray-300"
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
              <label className="form-label">Catatan Umum Dialog Pasca Supervisi</label>
              <textarea
                rows={3}
                className="form-input text-sm"
                placeholder="Ringkasan hasil dialog pasca supervisi..."
                value={catatanUmum}
                onChange={(e) => setCatatanUmum(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RTL */}
        <div className="card mb-5">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-gray-800 font-bold text-sm">Rencana Tindak Lanjut (RTL)</h3>
              <p className="text-gray-400 text-xs">Rumuskan tindak lanjut hasil supervisi bersama guru</p>
            </div>
            <button onClick={addRTL} className="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 btn-sm">
              <Plus className="w-3.5 h-3.5" />
              Tambah RTL
            </button>
          </div>
          <div className="p-5 space-y-4">
            {rtlItems.map((rtl, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">RTL #{i + 1}</span>
                  {rtlItems.length > 1 && (
                    <button
                      onClick={() => removeRTL(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                      title="Hapus RTL"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Aspek yang Dibina *</label>
                    <input
                      className="form-input text-sm"
                      value={rtl.aspek}
                      onChange={(e) => updateRTL(i, "aspek", e.target.value)}
                      placeholder="Contoh: Pengelolaan asesmen formatif"
                    />
                  </div>
                  <div>
                    <label className="form-label">Target Waktu</label>
                    <input
                      className="form-input text-sm"
                      value={rtl.target}
                      onChange={(e) => updateRTL(i, "target", e.target.value)}
                      placeholder="Contoh: 1 bulan ke depan"
                    />
                  </div>
                  <div>
                    <label className="form-label">Temuan</label>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      value={rtl.temuan}
                      onChange={(e) => updateRTL(i, "temuan", e.target.value)}
                      placeholder="Temuan yang perlu ditindaklanjuti..."
                    />
                  </div>
                  <div>
                    <label className="form-label">Rencana Tindak Lanjut</label>
                    <textarea
                      rows={2}
                      className="form-input text-sm"
                      value={rtl.rencana}
                      onChange={(e) => updateRTL(i, "rencana", e.target.value)}
                      placeholder="Rencana perbaikan yang disepakati..."
                    />
                  </div>
                  <div>
                    <label className="form-label">Deadline</label>
                    <input
                      type="date"
                      className="form-input text-sm"
                      value={rtl.deadline}
                      onChange={(e) => updateRTL(i, "deadline", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Status Monitoring</label>
                    <select
                      className="form-select text-sm"
                      value={rtl.statusMonitoring ?? "BELUM"}
                      onChange={(e) => updateRTL(i, "statusMonitoring", e.target.value)}
                    >
                      <option value="BELUM">Belum</option>
                      <option value="PROSES">Dalam Proses</option>
                      <option value="SELESAI">Selesai</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
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
              Selesaikan Supervisi
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
