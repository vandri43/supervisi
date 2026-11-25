"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FotoDokumentasi from "@/components/FotoDokumentasi";
import BuktiTugasPanel from "@/components/BuktiTugasPanel";
import Badge, { predikatBadge, statusBadge } from "@/components/ui/Badge";
import {
  ArrowLeft, Loader2, Trash2, User, School, Calendar, BookOpen,
  FileSearch, Eye, ClipboardCheck, ChevronRight, AlertTriangle, Printer,
  Paperclip, Camera, Pencil, X, Save, CheckCircle2,
} from "lucide-react";

interface GuruOption {
  id: string;
  nama: string;
  mapel: string | null;
  sekolahNama: string | null;
}

interface SiklusDetail {
  id: string;
  tahunAjaran: string;
  semester: "GANJIL" | "GENAP";
  status: string;
  kelas: string | null;
  mapel: string | null;
  topikPembelajaran: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  catatan: string | null;
  guru: { id: string; nama: string; email: string; nip: string | null; jabatan: string | null; mapel: string | null };
  supervisor: { id: string; nama: string; email: string; nip: string | null; jabatan: string | null };
  sekolah: { id: string; nama: string; npsn: string | null; kabupaten: string | null; provinsi: string | null } | null;
  praObservasi: { id: string; tanggal: string | null; totalSkor: number; nilaiAkhir: number; predikat: string | null; selesai: boolean; catatanUmum: string | null } | null;
  observasiKelas: { id: string; tanggal: string | null; totalSkor: number; skorMaks: number; nilaiAkhir: number; predikat: string | null; selesai: boolean; catatanUmum: string | null } | null;
  pascaSupervisi: {
    id: string;
    tanggal: string | null;
    totalSkor: number;
    nilaiAkhir: number;
    predikat: string | null;
    selesai: boolean;
    catatanUmum: string | null;
    rtl: { id: string; aspek: string; rencana: string; target: string | null; deadline: string | null; statusMonitoring: string }[];
  } | null;
}

const steps = [
  { key: "PRA", label: "Pra Observasi", icon: FileSearch, desc: "Telaah RPP/RPM & konferensi awal", href: "pra-observasi" },
  { key: "OBS", label: "Observasi Kelas", icon: Eye, desc: "Penilaian kinerja guru di kelas", href: "observasi" },
  { key: "PASCA", label: "Pasca Supervisi", icon: ClipboardCheck, desc: "Refleksi, umpan balik & RTL", href: "pasca" },
];

function statusToStep(status: string): number {
  switch (status) {
    case "DRAFT": return -1;
    case "PRA_OBSERVASI": return 0;
    case "OBSERVASI": return 1;
    case "PASCA_SUPERVISI": return 2;
    case "SELESAI": return 3;
    default: return -1;
  }
}

export default function SiklusDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<SiklusDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ── State modal edit ──────────────────────────────────────────────────────
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [guruList, setGuruList] = useState<GuruOption[]>([]);
  const [guruLoading, setGuruLoading] = useState(false);
  const [form, setForm] = useState({
    guruId: "",
    kelas: "",
    mapel: "",
    topikPembelajaran: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    catatan: "",
  });

  // Isi form saat data siklus dimuat
  const initForm = (d: SiklusDetail) => {
    setForm({
      guruId: d.guru.id,
      kelas: d.kelas ?? "",
      mapel: d.mapel ?? "",
      topikPembelajaran: d.topikPembelajaran ?? "",
      tanggalMulai: d.tanggalMulai ? d.tanggalMulai.slice(0, 10) : "",
      tanggalSelesai: d.tanggalSelesai ? d.tanggalSelesai.slice(0, 10) : "",
      catatan: d.catatan ?? "",
    });
  };

  const fetchGuru = useCallback(async () => {
    setGuruLoading(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      const list = Array.isArray(json) ? json.filter((u: { role: string }) => u.role === "GURU") : [];
      setGuruList(list.map((u: { id: string; nama: string; mapel: string | null; sekolah?: { nama: string } | null }) => ({
        id: u.id,
        nama: u.nama,
        mapel: u.mapel ?? null,
        sekolahNama: u.sekolah?.nama ?? null,
      })));
    } catch {
      // abaikan
    } finally {
      setGuruLoading(false);
    }
  }, []);

  const openEdit = () => {
    if (data) initForm(data);
    fetchGuru();
    setSaveMsg("");
    setSaveError("");
    setShowEdit(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveMsg("");
    try {
      const res = await fetch(`/api/siklus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guruId: form.guruId,
          kelas: form.kelas,
          mapel: form.mapel,
          topikPembelajaran: form.topikPembelajaran,
          tanggalMulai: form.tanggalMulai,
          tanggalSelesai: form.tanggalSelesai,
          catatan: form.catatan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      setSaveMsg("Perubahan berhasil disimpan.");
      await fetchDetail();
      setTimeout(() => setShowEdit(false), 900);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/siklus/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat detail siklus");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat detail siklus");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDelete = async () => {
    if (!data) return;
    if (!confirm(`Hapus siklus supervisi untuk ${data.guru.nama}? Seluruh data pra observasi, observasi, dan pasca supervisi pada siklus ini akan ikut terhapus.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/siklus/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus siklus");
      router.push("/supervisor/siklus");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus siklus");
      setDeleting(false);
    }
  };

  const fmtTanggal = (t: string | null) =>
    t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

  if (loading) {
    return (
      <DashboardLayout pageTitle="Detail Siklus" breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: "Detail" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat detail siklus...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Detail Siklus" breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: "Detail" }]}>
        <div className="max-w-lg mx-auto card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 text-sm mb-4">{error || "Siklus tidak ditemukan"}</p>
          <Link href="/supervisor/siklus" className="btn-primary inline-flex">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Siklus
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const sb = statusBadge(data.status);
  const currentStep = statusToStep(data.status);
  const nilaiSiklus = data.pascaSupervisi?.selesai
    ? data.pascaSupervisi.nilaiAkhir
    : data.observasiKelas?.selesai
    ? data.observasiKelas.nilaiAkhir
    : data.praObservasi?.selesai
    ? data.praObservasi.nilaiAkhir
    : null;
  const predikatSiklus = data.pascaSupervisi?.selesai
    ? data.pascaSupervisi.predikat
    : data.observasiKelas?.selesai
    ? data.observasiKelas.predikat
    : data.praObservasi?.selesai
    ? data.praObservasi.predikat
    : null;
  const pb = predikatSiklus ? predikatBadge(predikatSiklus) : null;

  const stageInfo = (i: number) => {
    if (currentStep > i) return { done: true, active: false };
    if (currentStep === i) return { done: false, active: true };
    if (currentStep === 3) return { done: true, active: false };
    return { done: false, active: false };
  };

  return (
    <DashboardLayout
      pageTitle="Detail Siklus Supervisi"
      breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: data.guru.nama }]}
    >
      <div className="max-w-4xl mx-auto">
        <Link href="/supervisor/siklus" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke daftar siklus
        </Link>

        {/* Header card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-800">{data.guru.nama}</h2>
                <Badge variant={sb.variant as "success" | "warning" | "danger" | "info" | "primary" | "default"}>{sb.label}</Badge>
                {pb && <Badge variant={pb.variant as "success" | "warning" | "danger" | "info" | "primary" | "default"}>{pb.label}</Badge>}
              </div>
              <p className="text-sm text-gray-500">
                {data.mapel ?? "-"} · {data.kelas ?? "-"} · T.A. {data.tahunAjaran} Semester {data.semester === "GANJIL" ? "Ganjil" : "Genap"}
              </p>
              {data.topikPembelajaran && (
                <p className="text-xs text-gray-400 italic mt-1">&quot;{data.topikPembelajaran}&quot;</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {nilaiSiklus !== null && (
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{nilaiSiklus.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">Nilai Akhir</p>
                </div>
              )}
              <button
                onClick={openEdit}
                className="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-2"
                title="Edit informasi siklus"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs">
                <p className="text-gray-400 mb-0.5">Supervisor</p>
                <p className="text-gray-700 font-medium">{data.supervisor.nama}</p>
                <p className="text-gray-400">{data.supervisor.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <School className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs">
                <p className="text-gray-400 mb-0.5">Sekolah</p>
                <p className="text-gray-700 font-medium">{data.sekolah?.nama ?? "-"}</p>
                <p className="text-gray-400">{data.sekolah?.kabupaten ?? ""}{data.sekolah?.provinsi ? `, ${data.sekolah.provinsi}` : ""}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs">
                <p className="text-gray-400 mb-0.5">Tanggal</p>
                <p className="text-gray-700 font-medium">Mulai: {fmtTanggal(data.tanggalMulai)}</p>
                <p className="text-gray-400">Selesai: {fmtTanggal(data.tanggalSelesai)}</p>
              </div>
            </div>
          </div>

          {data.catatan && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
              <p className="font-semibold text-gray-500 mb-1">Catatan</p>
              {data.catatan}
            </div>
          )}
        </div>

        {/* Tahapan siklus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {steps.map((step, i) => {
            const st = stageInfo(i);
            const detail =
              i === 0 ? data.praObservasi : i === 1 ? data.observasiKelas : data.pascaSupervisi;
            const Icon = step.icon;
            return (
              <div key={step.key} className={`card p-5 ${st.active ? "ring-2 ring-indigo-400" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    st.done ? "bg-green-50 text-green-600" : st.active ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-300"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {st.done ? (
                    <Badge variant="success">Selesai</Badge>
                  ) : st.active ? (
                    <Badge variant="primary">Sedang Berjalan</Badge>
                  ) : (
                    <Badge variant="default">Belum</Badge>
                  )}
                </div>
                <h4 className="text-gray-800 font-semibold text-sm">{step.label}</h4>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">{step.desc}</p>
                {detail ? (
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Nilai: <span className="font-semibold text-gray-700">{detail.nilaiAkhir.toFixed(1)}</span></p>
                    <p>{detail.tanggal ? fmtTanggal(detail.tanggal) : "Belum ada tanggal"}</p>
                  </div>
                ) : (
                  <div className="text-xs text-gray-300 mb-3">Belum ada data</div>
                )}
                <Link
                  href={`/supervisor/${step.href}/${data.id}`}
                  className={`btn btn-sm w-full justify-center ${
                    st.active ? "btn-primary" : st.done ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {detail ? "Lihat Detail" : st.active ? "Isi Sekarang" : "Belum Tersedia"}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bukti tugas guru */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600" /> Bukti Tugas Guru
            </h3>
          </div>
          <div className="p-5 pt-0">
            <BuktiTugasPanel siklusId={data.id} bisaVerifikasi />
          </div>
        </div>

        {/* Foto dokumentasi supervisi (bukti otentik) */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" /> Foto Dokumentasi Supervisi
            </h3>
          </div>
          <div className="p-5 pt-0">
            <FotoDokumentasi siklusId={data.id} bisaKelola />
          </div>
        </div>

        {/* RTL list jika ada */}
        {data.pascaSupervisi?.rtl && data.pascaSupervisi.rtl.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="text-gray-800 font-bold text-sm">Rencana Tindak Lanjut (RTL)</h3>
            </div>
            <div className="p-5 space-y-3">
              {data.pascaSupervisi.rtl.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-gray-700">{r.aspek}</p>
                    <Badge variant={r.statusMonitoring === "SELESAI" ? "success" : r.statusMonitoring === "PROSES" ? "warning" : "default"}>
                      {r.statusMonitoring === "SELESAI" ? "Selesai" : r.statusMonitoring === "PROSES" ? "Dalam Proses" : "Belum"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{r.rencana}</p>
                  {r.target && <p className="text-xs text-gray-400 mt-1">Target: {r.target}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info guru + aksi */}
        <div className="card p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-xs">
              <p className="text-gray-700 font-medium">{data.guru.nama}</p>
              <p className="text-gray-400">{data.guru.email}{data.guru.nip ? ` · NIP ${data.guru.nip}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/supervisor/siklus/${data.id}/cetak`}
              className="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-60"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Hapus Siklus
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ MODAL EDIT SIKLUS ══════════════ */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowEdit(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-500" /> Edit Siklus Supervisi
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Perubahan langsung tersimpan ke data siklus</p>
              </div>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">

              {/* Guru */}
              <div>
                <label className="form-label">Guru yang Disupervisi</label>
                {guruLoading ? (
                  <div className="form-input flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memuat daftar guru...
                  </div>
                ) : (
                  <select
                    className="form-select w-full"
                    value={form.guruId}
                    onChange={(e) => {
                      const g = guruList.find((x) => x.id === e.target.value);
                      setForm((f) => ({
                        ...f,
                        guruId: e.target.value,
                        mapel: g?.mapel ?? f.mapel,
                      }));
                    }}
                  >
                    <option value="">— Pilih Guru —</option>
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama}{g.mapel ? ` · ${g.mapel}` : ""}{g.sekolahNama ? ` · ${g.sekolahNama}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Kelas & Mapel */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Kelas <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="X-TKJ-1"
                    value={form.kelas}
                    onChange={(e) => setForm((f) => ({ ...f, kelas: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Mata Pelajaran</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Matematika"
                    value={form.mapel}
                    onChange={(e) => setForm((f) => ({ ...f, mapel: e.target.value }))}
                  />
                </div>
              </div>

              {/* Topik */}
              <div>
                <label className="form-label">Topik / Materi Pembelajaran</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Sistem Persamaan Linear"
                  value={form.topikPembelajaran}
                  onChange={(e) => setForm((f) => ({ ...f, topikPembelajaran: e.target.value }))}
                />
              </div>

              {/* Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Tanggal Mulai</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.tanggalMulai}
                    onChange={(e) => setForm((f) => ({ ...f, tanggalMulai: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Tanggal Selesai</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.tanggalSelesai}
                    onChange={(e) => setForm((f) => ({ ...f, tanggalSelesai: e.target.value }))}
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="form-label">Catatan (Opsional)</label>
                <textarea
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Catatan tambahan..."
                  value={form.catatan}
                  onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
                />
              </div>

              {/* Pesan sukses / error */}
              {saveMsg && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {saveMsg}
                </div>
              )}
              {saveError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {saveError}
                </div>
              )}

              {/* Tombol aksi */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowEdit(false)} className="btn bg-gray-100 text-gray-600 hover:bg-gray-200">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
