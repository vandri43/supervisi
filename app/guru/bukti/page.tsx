"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import {
  Link2, ExternalLink, Plus, Pencil, Trash2, Loader2, Inbox,
  CheckCircle2, Clock, XCircle, Paperclip, FolderOpen, ImagePlus, Film,
} from "lucide-react";

interface SiklusOption {
  id: string;
  topik: string | null;
  tahunAjaran: string;
  semester: string;
  status: string;
}

interface BuktiRow {
  id: string;
  siklusId: string;
  topikSiklus: string | null;
  tahunAjaran: string;
  semester: string;
  judul: string;
  jenis: string;
  jenisLabel: string;
  link: string;
  keterangan: string | null;
  status: "MENUNGGU" | "DITERIMA" | "DITOLAK";
  catatanVerifikasi: string | null;
  verifikator: string | null;
  diverifikasiPada: string | null;
  createdAt: string;
}

const JENIS_OPTIONS = [
  { value: "ANALISIS_CP", label: "Analisis Capaian Pembelajaran / Silabus" },
  { value: "RPP_RPM", label: "RPP/RPM" },
  { value: "RPE", label: "Rencana Pekan Efektif (RPE)" },
  { value: "MODUL_AJAR", label: "Modul Ajar" },
  { value: "VIDEO_PEMBELAJARAN", label: "Video Pembelajaran" },
  { value: "FOTO_KEGIATAN", label: "Foto Kegiatan" },
  { value: "LAINNYA", label: "Lainnya" },
];

const statusConfig: Record<BuktiRow["status"], { variant: BadgeVariant; label: string; icon: React.ElementType; cls: string }> = {
  MENUNGGU: { variant: "warning", label: "Menunggu Verifikasi", icon: Clock, cls: "bg-orange-50 border-orange-200 text-orange-600" },
  DITERIMA: { variant: "success", label: "Diterima", icon: CheckCircle2, cls: "bg-green-50 border-green-200 text-green-600" },
  DITOLAK:  { variant: "danger",  label: "Ditolak — Perlu Perbaikan", icon: XCircle, cls: "bg-red-50 border-red-200 text-red-600" },
};

const fmtTanggal = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

// Sama seperti kompresi di FotoDokumentasi: foto < 1MB sebelum dikirim
const FOTO_TARGET = 900 * 1024;

async function kompresFoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/heic" || file.type === "image/heif") return file;
  if (file.type === "image/jpeg" && file.size <= FOTO_TARGET) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maksSisi = 1600;
    const skala = Math.min(1, maksSisi / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * skala);
    const h = Math.round(bitmap.height * skala);
    for (const kualitas of [0.75, 0.6, 0.45, 0.35]) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", kualitas));
      if (blob && blob.size <= FOTO_TARGET) {
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      }
      if (!blob) break;
    }
    return file;
  } catch {
    return file;
  }
}

interface FormState {
  id: string | null;
  siklusId: string;
  judul: string;
  jenis: string;
  link: string;
  keterangan: string;
}

const formKosong: FormState = { id: null, siklusId: "", judul: "", jenis: "ANALISIS_CP", link: "", keterangan: "" };

type SumberBukti = "link" | "file";

export default function BuktiTugasPage() {
  const [bukti, setBukti] = useState<BuktiRow[]>([]);
  const [siklusList, setSiklusList] = useState<SiklusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<BuktiRow["status"] | "">("");
  const [filterSiklus, setFilterSiklus] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(formKosong);
  const [sumberBukti, setSumberBukti] = useState<SumberBukti>("link");
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSiklus = useCallback(async () => {
    try {
      const res = await fetch("/api/siklus");
      const json = await res.json();
      if (res.ok) setSiklusList(json);
    } catch {
      // dibiarkan kosong
    }
  }, []);

  const fetchBukti = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bukti");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat bukti");
      setBukti(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat bukti");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSiklus();
    fetchBukti();
  }, [fetchSiklus, fetchBukti]);

  const bukaFormTambah = () => {
    setForm({ ...formKosong, siklusId: filterSiklus || siklusList[0]?.id || "" });
    setSumberBukti("link");
    setFileList(null);
    setShowForm(true);
    setError("");
  };

  const bukaFormEdit = (b: BuktiRow) => {
    setForm({ id: b.id, siklusId: b.siklusId, judul: b.judul, jenis: b.jenis, link: b.link, keterangan: b.keterangan ?? "" });
    setSumberBukti("link");
    setFileList(null);
    setShowForm(true);
    setError("");
  };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // === Mode upload file foto/video (multi-file, bukan edit) ===
      if (!form.id && sumberBukti === "file") {
        if (!form.siklusId) throw new Error("Pilih siklus supervisi terlebih dahulu");
        if (!fileList || fileList.length === 0) throw new Error("Pilih minimal satu foto/video");
        for (const asli of Array.from(fileList)) {
          const file = asli.type.startsWith("video/") ? asli : await kompresFoto(asli);
          const fd = new FormData();
          fd.append("file", file);
          if (form.keterangan) fd.append("keterangan", form.keterangan);
          const res = await fetch(`/api/siklus/${form.siklusId}/foto`, { method: "POST", body: fd });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error || `Gagal mengunggah ${asli.name}`);
        }
        setShowForm(false);
        setForm(formKosong);
        setFileList(null);
        fetchBukti();
        return;
      }

      // === Mode link / edit ===
      const res = await fetch("/api/bukti", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(form.id ? { id: form.id } : { siklusId: form.siklusId }),
          judul: form.judul,
          jenis: form.jenis,
          link: form.link,
          keterangan: form.keterangan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan bukti");
      setShowForm(false);
      setForm(formKosong);
      setFileList(null);
      fetchBukti();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan bukti");
    } finally {
      setSaving(false);
    }
  };

  const hapus = async (b: BuktiRow) => {
    if (!confirm(`Hapus bukti "${b.judul}"?`)) return;
    setDeletingId(b.id);
    try {
      const res = await fetch(`/api/bukti?id=${b.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus bukti");
      fetchBukti();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus bukti");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(
    () =>
      bukti.filter(
        (b) =>
          (filterStatus ? b.status === filterStatus : true) &&
          (filterSiklus ? b.siklusId === filterSiklus : true)
      ),
    [bukti, filterStatus, filterSiklus]
  );

  const counts = {
    total: bukti.length,
    menunggu: bukti.filter((b) => b.status === "MENUNGGU").length,
    diterima: bukti.filter((b) => b.status === "DITERIMA").length,
    ditolak: bukti.filter((b) => b.status === "DITOLAK").length,
  };

  const isMediaBukti = (b: BuktiRow) => b.link.startsWith("/api/foto/");

  return (
    <DashboardLayout
      pageTitle="Bukti Tugas"
      breadcrumbs={[{ label: "Guru" }, { label: "Bukti Tugas" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Bukti", value: counts.total, icon: Paperclip, color: "text-indigo-600 bg-indigo-50" },
          { label: "Menunggu Verifikasi", value: counts.menunggu, icon: Clock, color: "text-orange-600 bg-orange-50" },
          { label: "Diterima", value: counts.diterima, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Ditolak", value: counts.ditolak, icon: XCircle, color: "text-red-600 bg-red-50" },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
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
          <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-600" /> Kumpulan Bukti Tugas
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterSiklus}
              onChange={(e) => setFilterSiklus(e.target.value)}
              className="form-select text-sm py-2 w-52"
            >
              <option value="">Semua Siklus</option>
              {siklusList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.topik ?? "(tanpa topik)"} — {s.semester === "GANJIL" ? "Ganjil" : "Genap"} {s.tahunAjaran}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as BuktiRow["status"] | "")}
              className="form-select text-sm py-2 w-40"
            >
              <option value="">Semua Status</option>
              <option value="MENUNGGU">Menunggu</option>
              <option value="DITERIMA">Diterima</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
            <button onClick={bukaFormTambah} className="btn-primary btn-sm" disabled={siklusList.length === 0}>
              <Plus className="w-4 h-4" /> Tambah Bukti
            </button>
          </div>
        </div>

        {siklusList.length === 0 && !loading && (
          <div className="mx-5 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-xs">
            Belum ada siklus supervisi pada tahun ajaran aktif. Bukti tugas dikumpulkan per siklus supervisi.
          </div>
        )}

        {error && (
          <div className="mx-5 mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" /> Memuat bukti...
          </div>
        )}

        {!loading && (
          <div className="divide-y divide-gray-100">
            {filtered.map((b) => {
              const sc = statusConfig[b.status];
              const Icon = sc.icon;
              return (
                <div key={b.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${sc.cls}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm truncate">{b.judul}</p>
                          <Badge variant="info">{b.jenisLabel}</Badge>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                          {isMediaBukti(b) && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                              <Film className="w-3 h-3" /> file upload
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {b.topikSiklus ?? "(tanpa topik)"} · {b.semester === "GANJIL" ? "Ganjil" : "Genap"} {b.tahunAjaran} · Diunggah {fmtTanggal(b.createdAt)}
                        </p>
                        {b.keterangan && <p className="text-xs text-gray-500 mt-1">{b.keterangan}</p>}
                        {b.status === "DITOLAK" && b.catatanVerifikasi && (
                          <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
                            <span className="font-semibold">Catatan pengawas:</span> {b.catatanVerifikasi}
                          </div>
                        )}
                        {b.status === "DITERIMA" && b.verifikator && (
                          <p className="text-[11px] text-green-600 mt-1">Diverifikasi oleh {b.verifikator} · {fmtTanggal(b.diverifikasiPada)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={b.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                        title="Buka bukti"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Buka
                      </a>
                      {!isMediaBukti(b) && (
                        <button
                          onClick={() => bukaFormEdit(b)}
                          className="btn btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Edit bukti"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => hapus(b)}
                        disabled={deletingId === b.id}
                        className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-60"
                        title="Hapus bukti"
                      >
                        {deletingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">
                  {bukti.length === 0
                    ? "Belum ada bukti. Klik \u201cTambah Bukti\u201d untuk mengumpulkan Analisis CP, RPP/RPM, RPE, foto, atau video."
                    : "Tidak ada bukti sesuai filter"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/50 overflow-y-auto py-6" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-gray-800 font-bold text-base mb-1">
              {form.id ? "Edit Bukti" : "Tambah Bukti Tugas"}
            </h3>
            <p className="text-gray-400 text-xs mb-4 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Kumpulkan via link (Drive/YouTube) atau unggah file foto/video
            </p>

            <form onSubmit={simpan} className="space-y-4">
              {!form.id && (
                <div>
                  <label className="form-label">Siklus Supervisi</label>
                  <select
                    value={form.siklusId}
                    onChange={(e) => setForm((f) => ({ ...f, siklusId: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="">— Pilih siklus —</option>
                    {siklusList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.topik ?? "(tanpa topik)"} — {s.semester === "GANJIL" ? "Ganjil" : "Genap"} {s.tahunAjaran}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!form.id && (
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setSumberBukti("link")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${sumberBukti === "link" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
                  >
                    Link (Drive/YouTube)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSumberBukti("file")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${sumberBukti === "file" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
                  >
                    Upload Foto/Video
                  </button>
                </div>
              )}

              {sumberBukti === "file" && !form.id && (
                <div>
                  <label className="form-label">File Foto/Video (bisa lebih dari satu)</label>
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime"
                      multiple
                      className="hidden"
                      onChange={(e) => setFileList(e.target.files)}
                    />
                    <ImagePlus className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {fileList && fileList.length > 0 ? `${fileList.length} file dipilih` : "Klik untuk pilih dari galeri / kamera HP"}
                    </span>
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Foto otomatis dikompres &lt; 1 MB · Video maks 50 MB · Tercatat sebagai bukti Foto Kegiatan / Video Pembelajaran
                  </p>
                </div>
              )}

              {sumberBukti === "link" && (
                <>
                  <div>
                    <label className="form-label">Judul Bukti</label>
                    <input
                      type="text"
                      value={form.judul}
                      onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
                      placeholder="Contoh: RPP Matematika Kelas VII — Bangun Ruang"
                      className="form-input"
                      required={sumberBukti === "link" || !!form.id}
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="form-label">Jenis Bukti</label>
                    <select
                      value={form.jenis}
                      onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))}
                      className="form-select"
                    >
                      {JENIS_OPTIONS.map((j) => (
                        <option key={j.value} value={j.value}>{j.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Link Bukti</label>
                    <input
                      type="url"
                      value={form.link}
                      onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                      placeholder="https://drive.google.com/... atau https://youtube.com/..."
                      className="form-input"
                      required={sumberBukti === "link" || !!form.id}
                      maxLength={1000}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Pastikan link dapat diakses pengawas (untuk Drive: set akses &quot;Anyone with the link&quot;).
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="form-label">Keterangan (opsional)</label>
                <textarea
                  rows={2}
                  value={form.keterangan}
                  onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                  placeholder="Keterangan tambahan tentang bukti ini..."
                  className="form-input text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn bg-gray-100 text-gray-600 hover:bg-gray-200">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || (!form.id && !form.siklusId) || (sumberBukti === "file" && !form.id && (!fileList || fileList.length === 0))}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {form.id ? "Simpan Perubahan" : "Kumpulkan Bukti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
