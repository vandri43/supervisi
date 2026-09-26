"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import {
  Loader2, Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown,
  ClipboardList, MessageCircleQuestion, ChevronDown as ChevronDownIc, ChevronUp as ChevronUpIc,
  MousePointerClick,
} from "lucide-react";

interface IndikatorDb {
  id: string;
  no: number;
  deskripsi: string;
  dimensi: string | null;
  tagPM: string | null;
}

interface KomponenDb {
  id: string;
  kode: string;
  judul: string;
  urutan: number;
  indikator: IndikatorDb[];
}

interface StageData {
  stage: string;
  label: string;
  komponen: KomponenDb[];
  skorMaks: number;
}

const DIMENSI_OPTIONS = ["Umum", "BBM", "3M", "Literasi", "Numerasi", "Asesmen"];

export default function InstrumenAdminPage() {
  const [stages, setStages] = useState<StageData[]>([]);
  const [konferensi, setKonferensi] = useState<{ id: string; pertanyaan: string }[]>([]);
  const [activeStage, setActiveStage] = useState("pra");
  const [openKomp, setOpenKomp] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // form tambah
  const [newKomp, setNewKomp] = useState({ kode: "", judul: "" });
  const [newInd, setNewInd] = useState<Record<string, { deskripsi: string; dimensi: string; tagPM: string }>>({});
  const [newKonf, setNewKonf] = useState("");

  // edit state
  const [editKomp, setEditKomp] = useState<{ id: string; judul: string } | null>(null);
  const [editInd, setEditInd] = useState<{ id: string; deskripsi: string; dimensi: string; tagPM: string } | null>(null);
  const [editKonf, setEditKonf] = useState<{ id: string; pertanyaan: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/instrumen"),
        fetch("/api/admin/instrumen?konferensiDetail=1"),
      ]);
      const json = await r1.json();
      if (!r1.ok) throw new Error(json.error || "Gagal memuat instrumen");
      setStages(json.stages ?? []);
      const j2 = await r2.json();
      if (r2.ok && Array.isArray(j2.konferensi)) {
        setKonferensi(j2.konferensi);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat instrumen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const stage = stages.find((s) => s.stage === activeStage);
  const isObservasi = activeStage === "observasi";

  // Buka otomatis komponen pertama pada stage aktif agar daftar indikator langsung terlihat
  useEffect(() => {
    const st = stages.find((s) => s.stage === activeStage);
    if (st && st.komponen.length > 0) {
      setOpenKomp((p) => (p[st.komponen[0].id] ? p : { ...p, [st.komponen[0].id]: true }));
    }
  }, [activeStage, stages]);

  const aksi = async (fn: () => Promise<Response>, sukses: string) => {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fn();
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gagal");
      setMsg(sukses);
      await fetchAll();
      await fetchKonfDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const fetchKonfDetail = useCallback(async () => {
    const res = await fetch("/api/admin/instrumen?konferensiDetail=1");
    const j = await res.json();
    if (res.ok && Array.isArray(j.konferensi)) setKonferensi(j.konferensi);
  }, []);

  return (
    <DashboardLayout pageTitle="Instrumen Supervisi" breadcrumbs={[{ label: "Admin" }, { label: "Instrumen Supervisi" }]}>
      <div className="max-w-5xl mx-auto">
        <div className="card p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-gray-800 font-bold">Kelola Instrumen Supervisi</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Tambah, edit, hapus komponen &amp; indikator penilaian tiap tahap. Perubahan langsung berlaku untuk semua siklus baru.
                Data siklus yang sudah dinilai tidak berubah.
              </p>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
        {msg && <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{msg}</div>}

        {/* Petunjuk cara pakai */}
        <div className="mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-start gap-2">
          <MousePointerClick className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Cara mengelola indikator:</strong> klik judul komponen (atau tombol ▼ di kanan) untuk membuka daftar indikator.
            Di dalamnya ada tombol <strong>edit ✏</strong> dan <strong>hapus 🗑</strong> pada tiap indikator, serta form <strong>Tambah Indikator</strong> di bagian bawah.
          </span>
        </div>

        {/* Tab stage */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {stages.map((s) => (
            <button
              key={s.stage}
              onClick={() => setActiveStage(s.stage)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeStage === s.stage ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s.label.split(" (")[0]}
              <span className="ml-1.5 text-[10px] text-gray-400">/{s.skorMaks}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveStage("konferensi")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${activeStage === "konferensi" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <MessageCircleQuestion className="w-4 h-4" /> Konferensi
          </button>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" /> Memuat instrumen...
          </div>
        )}

        {/* ====== TAB KONFERENSI ====== */}
        {!loading && activeStage === "konferensi" && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-gray-800 font-bold text-sm">Pertanyaan Konferensi Pra-Observasi</h3>
              <p className="text-gray-400 text-xs">Ditanyakan kepada guru saat konferensi awal sebelum observasi</p>
            </div>
            <div className="p-5 space-y-3">
              {konferensi.map((k, i) => (
                <div key={k.id} className="border border-gray-100 rounded-xl p-3 flex items-start gap-3">
                  <span className="text-xs font-bold text-gray-400 mt-1.5">{i + 1}.</span>
                  {editKonf?.id === k.id ? (
                    <>
                      <textarea
                        rows={2}
                        value={editKonf.pertanyaan}
                        onChange={(e) => setEditKonf({ ...editKonf, pertanyaan: e.target.value })}
                        className="form-input text-sm flex-1"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() =>
                            aksi(
                              () =>
                                fetch("/api/admin/instrumen", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ tipe: "konferensi", id: k.id, pertanyaan: editKonf.pertanyaan }),
                                }),
                              "Pertanyaan diperbarui"
                            )
                          }
                          disabled={busy}
                          className="btn btn-sm bg-green-50 text-green-600 border border-green-200"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditKonf(null)} className="btn btn-sm bg-gray-100 text-gray-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 flex-1">{k.pertanyaan}</p>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setEditKonf({ id: k.id, pertanyaan: k.pertanyaan })} className="btn btn-sm bg-gray-100 text-gray-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Hapus pertanyaan ini?")) {
                              aksi(
                                () => fetch(`/api/admin/instrumen?tipe=konferensi&id=${k.id}`, { method: "DELETE" }),
                                "Pertanyaan dihapus"
                              );
                            }
                          }}
                          disabled={busy}
                          className="btn btn-sm bg-red-50 text-red-600 border border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              <div className="pt-3 border-t border-gray-100">
                <label className="form-label">Tambah Pertanyaan Baru</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKonf}
                    onChange={(e) => setNewKonf(e.target.value)}
                    placeholder="Tulis pertanyaan konferensi baru..."
                    className="form-input flex-1"
                  />
                  <button
                    onClick={() => {
                      if (!newKonf.trim()) return;
                      aksi(
                        () =>
                          fetch("/api/admin/instrumen", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ tipe: "konferensi", pertanyaan: newKonf }),
                          }),
                        "Pertanyaan ditambahkan"
                      );
                      setNewKonf("");
                    }}
                    disabled={busy || !newKonf.trim()}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== TAB STAGE (PRA/OBSERVASI/PASCA) ====== */}
        {!loading && stage && (
          <>
            {/* Tambah komponen */}
            <div className="card p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tambah Komponen Baru</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={newKomp.kode}
                  onChange={(e) => setNewKomp((f) => ({ ...f, kode: e.target.value }))}
                  placeholder="Kode (mis. K)"
                  className="form-input w-28"
                  maxLength={10}
                />
                <input
                  type="text"
                  value={newKomp.judul}
                  onChange={(e) => setNewKomp((f) => ({ ...f, judul: e.target.value }))}
                  placeholder="Judul komponen..."
                  className="form-input flex-1 min-w-[200px]"
                />
                <button
                  onClick={() => {
                    if (!newKomp.kode.trim() || !newKomp.judul.trim()) return;
                    aksi(
                      () =>
                        fetch("/api/admin/instrumen", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ tipe: "komponen", stage: activeStage, kode: newKomp.kode, judul: newKomp.judul }),
                        }),
                      "Komponen ditambahkan"
                    );
                    setNewKomp({ kode: "", judul: "" });
                  }}
                  disabled={busy || !newKomp.kode.trim() || !newKomp.judul.trim()}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" /> Tambah Komponen
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {stage.komponen.map((k, idx) => {
                const isOpen = !!openKomp[k.id];
                const ni = newInd[k.id] ?? { deskripsi: "", dimensi: "Umum", tagPM: "" };
                return (
                  <div key={k.id} className="card overflow-hidden">
                    <div className="card-header flex items-center justify-between gap-3 flex-wrap">
                      <button
                        onClick={() => setOpenKomp((p) => ({ ...p, [k.id]: !p[k.id] }))}
                        className="flex items-center gap-3 flex-1 text-left min-w-0"
                        title="Klik untuk buka/tutup daftar indikator"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {k.kode}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{k.judul}</p>
                          <p className="text-xs text-gray-400">{k.indikator.length} indikator · skor maks {k.indikator.length * 4}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setOpenKomp((p) => ({ ...p, [k.id]: !p[k.id] }))}
                          className="btn btn-sm bg-indigo-50 text-indigo-600 border border-indigo-200 mr-1"
                          title={isOpen ? "Tutup daftar indikator" : "Buka daftar indikator"}
                        >
                          {isOpen ? "Tutup" : "Buka"} {isOpen ? <ChevronUpIc className="w-3.5 h-3.5 inline" /> : <ChevronDownIc className="w-3.5 h-3.5 inline" />}
                        </button>
                        <button
                          onClick={() =>
                            aksi(
                              () =>
                                fetch("/api/admin/instrumen", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ tipe: "geser", id: k.id, arah: "atas" }),
                                }),
                              "Urutan diubah"
                            )
                          }
                          disabled={busy || idx === 0}
                          className="btn btn-sm bg-gray-100 text-gray-600 disabled:opacity-40"
                          title="Naik"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            aksi(
                              () =>
                                fetch("/api/admin/instrumen", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ tipe: "geser", id: k.id, arah: "bawah" }),
                                }),
                              "Urutan diubah"
                            )
                          }
                          disabled={busy || idx === stage.komponen.length - 1}
                          className="btn btn-sm bg-gray-100 text-gray-600 disabled:opacity-40"
                          title="Turun"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditKomp({ id: k.id, judul: k.judul })} className="btn btn-sm bg-gray-100 text-gray-600" title="Edit judul">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus komponen "${k.judul}" beserta ${k.indikator.length} indikatornya?`)) {
                              aksi(
                                () => fetch(`/api/admin/instrumen?tipe=komponen&id=${k.id}`, { method: "DELETE" }),
                                "Komponen dihapus"
                              );
                            }
                          }}
                          disabled={busy}
                          className="btn btn-sm bg-red-50 text-red-600 border border-red-200"
                          title="Hapus komponen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {isOpen ? <ChevronUpIc className="w-4 h-4 text-gray-400" /> : <ChevronDownIc className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Edit judul komponen */}
                    {editKomp?.id === k.id && (
                      <div className="px-5 py-3 bg-indigo-50/60 border-b border-indigo-100 flex gap-2">
                        <input
                          type="text"
                          value={editKomp.judul}
                          onChange={(e) => setEditKomp({ ...editKomp, judul: e.target.value })}
                          className="form-input flex-1 text-sm"
                        />
                        <button
                          onClick={() =>
                            aksi(
                              () =>
                                fetch("/api/admin/instrumen", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ tipe: "komponen", id: k.id, judul: editKomp.judul }),
                                }),
                              "Judul komponen diperbarui"
                            )
                          }
                          disabled={busy}
                          className="btn-success btn-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Simpan
                        </button>
                        <button onClick={() => setEditKomp(null)} className="btn btn-sm bg-gray-100 text-gray-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isOpen && (
                      <div className="divide-y divide-gray-50">
                        {k.indikator.map((ind) => (
                          <div key={ind.id || `no${ind.no}`} className="px-5 py-3">
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-bold text-gray-400 flex-shrink-0 mt-1">
                                {k.kode}{ind.no}
                              </span>
                              {editInd?.id === ind.id ? (
                                <div className="flex-1 space-y-2">
                                  <textarea
                                    rows={2}
                                    value={editInd.deskripsi}
                                    onChange={(e) => setEditInd({ ...editInd, deskripsi: e.target.value })}
                                    className="form-input text-sm"
                                  />
                                  <div className="flex gap-2 flex-wrap">
                                    {isObservasi && (
                                      <select
                                        value={editInd.dimensi}
                                        onChange={(e) => setEditInd({ ...editInd, dimensi: e.target.value })}
                                        className="form-select text-sm w-36"
                                      >
                                        {DIMENSI_OPTIONS.map((d) => (
                                          <option key={d} value={d}>{d}</option>
                                        ))}
                                      </select>
                                    )}
                                    <input
                                      type="text"
                                      value={editInd.tagPM}
                                      onChange={(e) => setEditInd({ ...editInd, tagPM: e.target.value })}
                                      placeholder="Tag PM (opsional)"
                                      className="form-input text-sm w-40"
                                      maxLength={30}
                                    />
                                    <button
                                      onClick={() => {
                                        const ei = editInd;
                                        aksi(
                                          () =>
                                            fetch("/api/admin/instrumen", {
                                              method: "PUT",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ tipe: "indikator", id: ei.id, deskripsi: ei.deskripsi, dimensi: ei.dimensi, tagPM: ei.tagPM }),
                                            }),
                                          "Indikator diperbarui"
                                        );
                                      }}
                                      disabled={busy || !editInd.deskripsi.trim()}
                                      className="btn-success btn-sm"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Simpan
                                    </button>
                                    <button onClick={() => setEditInd(null)} className="btn btn-sm bg-gray-100 text-gray-500">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-700 flex-1">{ind.deskripsi}</p>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {isObservasi && ind.dimensi && <Badge variant="info">{ind.dimensi}</Badge>}
                                    {ind.tagPM && <Badge variant="primary">{ind.tagPM}</Badge>}
                                    <button
                                      onClick={() => setEditInd({ id: ind.id, deskripsi: ind.deskripsi, dimensi: ind.dimensi ?? "Umum", tagPM: ind.tagPM ?? "" })}
                                      className="btn btn-sm bg-gray-100 text-gray-600"
                                      title="Edit indikator"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Hapus indikator ${k.kode}${ind.no}? Nomor indikator lain tidak berubah.`)) {
                                          aksi(
                                            () => fetch(`/api/admin/instrumen?tipe=indikator&id=${ind.id}`, { method: "DELETE" }),
                                            "Indikator dihapus"
                                          );
                                        }
                                      }}
                                      disabled={busy}
                                      className="btn btn-sm bg-red-50 text-red-600 border border-red-200"
                                      title="Hapus indikator"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Tambah indikator */}
                        <div className="px-5 py-3 bg-gray-50/60">
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-gray-400 mt-2.5">
                              {k.kode}{k.indikator.length + 1}
                            </span>
                            <div className="flex-1 space-y-2">
                              <textarea
                                rows={2}
                                value={ni.deskripsi}
                                onChange={(e) => setNewInd((p) => ({ ...p, [k.id]: { ...ni, deskripsi: e.target.value } }))}
                                placeholder="Tulis deskripsi indikator baru..."
                                className="form-input text-sm"
                              />
                              <div className="flex gap-2 flex-wrap">
                                {isObservasi && (
                                  <select
                                    value={ni.dimensi}
                                    onChange={(e) => setNewInd((p) => ({ ...p, [k.id]: { ...ni, dimensi: e.target.value } }))}
                                    className="form-select text-sm w-36"
                                  >
                                    {DIMENSI_OPTIONS.map((d) => (
                                      <option key={d} value={d}>{d}</option>
                                    ))}
                                  </select>
                                )}
                                <input
                                  type="text"
                                  value={ni.tagPM}
                                  onChange={(e) => setNewInd((p) => ({ ...p, [k.id]: { ...ni, tagPM: e.target.value } }))}
                                  placeholder="Tag PM (opsional)"
                                  className="form-input text-sm w-40"
                                  maxLength={30}
                                />
                                <button
                                  onClick={() => {
                                    if (!ni.deskripsi.trim()) return;
                                    aksi(
                                      () =>
                                        fetch("/api/admin/instrumen", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ tipe: "indikator", komponenId: k.id, deskripsi: ni.deskripsi, dimensi: ni.dimensi, tagPM: ni.tagPM }),
                                        }),
                                      "Indikator ditambahkan"
                                    );
                                    setNewInd((p) => ({ ...p, [k.id]: { deskripsi: "", dimensi: "Umum", tagPM: "" } }));
                                  }}
                                  disabled={busy || !ni.deskripsi.trim()}
                                  className="btn-primary btn-sm"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Tambah Indikator
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {stage.komponen.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Belum ada komponen pada tahap ini. Tambahkan komponen pertama di atas.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
