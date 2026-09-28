"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";

interface SkItem {
  id: string;
  judul: string;
  url: string;
  tipe: "pdf" | "gambar";
  fileName: string;
  mimeType: string;
  ukuran: number;
  keterangan: string | null;
  uploader: string;
  createdAt: string;
}

function formatUkuran(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTanggal(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminSkPage() {
  const [items, setItems] = useState<SkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState<SkItem | null>(null);
  const [hapusTarget, setHapusTarget] = useState<SkItem | null>(null);
  const [judul, setJudul] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const muatData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sk");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setItems(data);
    } catch {
      // abaikan
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatData();
  }, [muatData]);

  function pilihFile(list: FileList | null) {
    if (!list) return;
    setFiles(Array.from(list));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setMessage({ type: "error", text: "Pilih file PDF atau gambar terlebih dahulu." });
      return;
    }
    setUploading(true);
    setMessage(null);

    const fd = new FormData();
    for (const f of files) fd.append("file", f);
    if (judul.trim()) fd.append("judul", judul.trim());
    if (keterangan.trim()) fd.append("keterangan", keterangan.trim());

    try {
      const res = await fetch("/api/admin/sk", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Gagal mengunggah dokumen SK" });
      } else {
        const gagal = Array.isArray(data.gagal) ? data.gagal : [];
        const pesanGagal = gagal.length > 0
          ? ` (${gagal.length} file gagal: ${gagal.map((g: { fileName: string }) => g.fileName).join(", ")})`
          : "";
        setMessage({
          type: "success",
          text: `${data.jumlah} dokumen SK berhasil diunggah & langsung tampil di halaman login.${pesanGagal}`,
        });
        setFiles([]);
        setJudul("");
        setKeterangan("");
        if (inputRef.current) inputRef.current.value = "";
        await muatData();
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan saat mengunggah." });
    } finally {
      setUploading(false);
    }
  }

  async function handleHapus() {
    if (!hapusTarget) return;
    setDeletingId(hapusTarget.id);
    try {
      const res = await fetch(`/api/admin/sk?id=${hapusTarget.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Gagal menghapus dokumen" });
      } else {
        setMessage({ type: "success", text: `Dokumen "${hapusTarget.judul}" telah dihapus.` });
        setItems((prev) => prev.filter((i) => i.id !== hapusTarget.id));
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setDeletingId(null);
      setHapusTarget(null);
    }
  }

  return (
    <DashboardLayout pageTitle="Dokumen SK" breadcrumbs={[{ label: "Admin" }, { label: "Dokumen SK" }]}>
      <div className="max-w-4xl mx-auto">
        {/* Info */}
        <div className="mb-5 flex items-start gap-2 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
          <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            Dokumen SK (Surat Keputusan) yang diunggah di sini akan <b>tampil otomatis di halaman login awal</b> —
            bisa dilihat publik tanpa login. Format: <b>PDF</b> (terbuka otomatis di tab browser) atau gambar
            JPG/PNG/WEBP. Ukuran maksimal <b>10 MB</b> per file.
          </div>
        </div>

        {/* Form upload */}
        <form onSubmit={handleUpload} className="card mb-5">
          <div className="card-header flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-gray-800 font-bold text-sm">Unggah Dokumen SK</h3>
              <p className="text-gray-400 text-xs">Bisa pilih beberapa file sekaligus</p>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="form-label">File SK (PDF / JPG / PNG / WEBP)</label>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => pilihFile(e.target.files)}
                className="form-input file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 file:text-xs file:font-semibold file:cursor-pointer"
              />
              {files.length > 0 && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {files.length} file dipilih: {files.map((f) => f.name).join(", ")}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Judul (opsional)</label>
                <input
                  className="form-input"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Kosongkan = pakai nama file"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-1">Ditampilkan sebagai label dokumen di halaman login.</p>
              </div>
              <div>
                <label className="form-label">Keterangan (opsional)</label>
                <input
                  className="form-input"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="mis. SK Tim Penilai Semester Ganjil"
                  maxLength={255}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="submit" className="btn-primary" disabled={uploading || files.length === 0}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Unggah
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Message */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 mb-5 text-sm flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Daftar dokumen */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-gray-800 font-bold text-sm">Daftar Dokumen SK ({items.length})</h3>
              <p className="text-gray-400 text-xs">Semua dokumen di daftar ini tampil publik di halaman login</p>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="py-10 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat daftar...
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Belum ada dokumen SK. Unggah dokumen pertama melalui form di atas.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 bg-gray-50/50"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-white border border-gray-200">
                      {item.tipe === "gambar" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt={item.judul} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <FileText className="w-6 h-6 text-red-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.judul}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {item.tipe === "pdf" ? "PDF" : "Gambar"} · {formatUkuran(item.ukuran)} ·{" "}
                        {formatTanggal(item.createdAt)} · oleh {item.uploader}
                        {item.keterangan ? ` · ${item.keterangan}` : ""}
                      </p>
                    </div>

                    {/* Aksi */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreview(item)}
                        className="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-xs"
                        title="Lihat dokumen"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Lihat
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 text-xs"
                        title="Buka di tab baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setHapusTarget(item)}
                        disabled={deletingId === item.id}
                        className="btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs"
                        title="Hapus dokumen"
                      >
                        {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal preview (gambar inline / PDF embed) */}
      {preview && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{preview.judul}</p>
                <p className="text-xs text-gray-400 truncate">{preview.fileName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Tab Baru
                </a>
                <button onClick={() => setPreview(null)} className="btn bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900/95">
              {preview.tipe === "pdf" ? (
                <object data={preview.url} type="application/pdf" className="w-full h-[75vh]">
                  <div className="p-8 text-center text-white/80 text-sm">
                    Pratinjau PDF tidak didukung browser ini.
                    <a href={preview.url} target="_blank" rel="noopener noreferrer" className="block mt-3 text-indigo-300 underline">
                      Buka PDF di tab baru
                    </a>
                  </div>
                </object>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.judul} className="max-h-[75vh] w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {hapusTarget && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={() => setHapusTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-gray-800 font-bold">Hapus Dokumen?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              &quot;{hapusTarget.judul}&quot; akan dihapus permanen dan tidak lagi tampil di halaman login. Tindakan ini
              tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setHapusTarget(null)} className="btn bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm">
                Batal
              </button>
              <button
                onClick={handleHapus}
                disabled={deletingId === hapusTarget.id}
                className="btn bg-red-600 text-white hover:bg-red-700 text-sm flex items-center gap-2"
              >
                {deletingId === hapusTarget.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
