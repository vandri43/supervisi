"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, X, Camera, RefreshCw, Film, Link2, ExternalLink } from "lucide-react";
import { deteksiProvider } from "@/lib/media-link";

interface MediaItem {
  id: string;
  url: string;
  mime: string;
  keterangan: string | null;
  fileName: string;
  ukuran: number;
  uploader: string;
  createdAt: string;
}

interface LinkItem {
  id: string;
  judul: string;
  url: string;
  provider: string;
  providerId: string | null;
  keterangan: string | null;
  uploader: string;
  createdAt: string;
}

const FOTO_TARGET = 900 * 1024; // target hasil kompresi < 1MB
const FOTO_MAKS_CLIENT = 2 * 1024 * 1024;
const VIDEO_MAKS_CLIENT = 50 * 1024 * 1024;

const fmtUkuran = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

// Kompres foto di browser: resize maks 1600px sisi terpanjang + turunkan kualitas
// JPEG bertahap hingga di bawah target. HEIC tidak bisa didekode browser → dikirim
// apa adanya (server menoleransi hingga 2MB). Bukan gambar / gagal decode → apa adanya.
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
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", kualitas)
      );
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

interface FotoDokumentasiProps {
  siklusId: string;
  /** supervisor = bisa upload & hapus; guru = hanya lihat */
  bisaKelola?: boolean;
}

export default function FotoDokumentasi({ siklusId, bisaKelola = false }: FotoDokumentasiProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [linkLihat, setLinkLihat] = useState<LinkItem | null>(null);
  const [srcCache, setSrcCache] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // form tambah link
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkJudul, setLinkJudul] = useState("");
  const [linkKet, setLinkKet] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/siklus/${siklusId}/foto`),
        fetch(`/api/siklus/${siklusId}/media-link`),
      ]);
      if (r1.ok) setMedia(await r1.json());
      if (r2.ok) setLinks(await r2.json());
    } catch {
      // dibiarkan kosong
    } finally {
      setLoading(false);
    }
  }, [siklusId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Foto kecil dimuat via fetch (blob URL). Video langsung pakai URL asli —
  // request media same-origin membawa cookie sesi, jadi tetap terautentikasi.
  useEffect(() => {
    let cancelled = false;
    const cache: Record<string, string> = {};
    (async () => {
      for (const m of media) {
        if (m.mime.startsWith("video/") || srcCache[m.id]) continue;
        try {
          const res = await fetch(m.url);
          if (!res.ok) continue;
          const blob = await res.blob();
          cache[m.id] = URL.createObjectURL(blob);
        } catch {
          // abaikan
        }
      }
      if (!cancelled && Object.keys(cache).length > 0) {
        setSrcCache((prev) => ({ ...prev, ...cache }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const asli of Array.from(files)) {
        const file = asli.type.startsWith("video/") ? asli : await kompresFoto(asli);
        if (file.type.startsWith("video/") && file.size > VIDEO_MAKS_CLIENT) {
          throw new Error(`Video "${file.name}" melebihi 50 MB`);
        }
        if (!file.type.startsWith("video/") && file.size > FOTO_MAKS_CLIENT) {
          throw new Error(`Foto "${file.name}" tetap di atas 2 MB setelah kompresi`);
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/siklus/${siklusId}/foto`, { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `Gagal mengunggah ${file.name}`);
      }
      fetchMedia();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const hapus = async (m: MediaItem) => {
    if (!confirm(`Hapus "${m.fileName}"?`)) return;
    try {
      const res = await fetch(`/api/foto/${m.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      setLightbox(null);
      fetchMedia();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
    }
  };

  const simpanLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLink(true);
    setError("");
    try {
      const res = await fetch(`/api/siklus/${siklusId}/media-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul: linkJudul, url: linkUrl, keterangan: linkKet }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan link");
      setLinkUrl("");
      setLinkJudul("");
      setLinkKet("");
      setShowLinkForm(false);
      fetchMedia();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan link");
    } finally {
      setSavingLink(false);
    }
  };

  const hapusLink = async (l: LinkItem) => {
    if (!confirm(`Hapus link "${l.judul}"?`)) return;
    try {
      const res = await fetch(`/api/siklus/${siklusId}/media-link?linkId=${l.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gagal menghapus link");
      fetchMedia();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus link");
    }
  };

  // Terjemahan deteksiProvider untuk tampilan thumbnail
  const prov = (l: LinkItem) => deteksiProvider(l.url);

  const jumlahVideo = media.filter((m) => m.mime.startsWith("video/")).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <p className="text-sm text-gray-500">
          {loading
            ? "Memuat dokumentasi..."
            : media.length > 0
            ? `${media.length} media${jumlahVideo > 0 ? ` (${media.length - jumlahVideo} foto, ${jumlahVideo} video)` : ""} — bukti otentik pelaksanaan supervisi. Foto dikompres otomatis < 1 MB.`
            : bisaKelola
            ? "Belum ada dokumentasi. Unggah foto/video kegiatan supervisi sebagai bukti otentik."
            : "Belum ada dokumentasi pada siklus ini."}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={fetchMedia} className="btn btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200" title="Muat ulang">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {bisaKelola && (
            <>
              <button
                onClick={() => setShowLinkForm((v) => !v)}
                className="btn btn-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
              >
                <Link2 className="w-3.5 h-3.5" /> Tambah Link
              </button>
              <label className={`btn btn-sm btn-primary cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {uploading ? "Memproses..." : "Unggah Foto/Video"}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime"
                  multiple
                  className="hidden"
                  onChange={(e) => upload(e.target.files)}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
      )}

      {/* Form tambah link YouTube / Google Drive */}
      {showLinkForm && bisaKelola && (
        <form onSubmit={simpanLink} className="mb-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
          <div>
            <label className="form-label">Link YouTube / Google Drive</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... atau https://drive.google.com/file/d/..."
              className="form-input"
              required
              maxLength={1000}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Judul (opsional)</label>
              <input
                type="text"
                value={linkJudul}
                onChange={(e) => setLinkJudul(e.target.value)}
                placeholder="Contoh: Video Observasi Kelas"
                className="form-input"
                maxLength={200}
              />
            </div>
            <div>
              <label className="form-label">Keterangan (opsional)</label>
              <input
                type="text"
                value={linkKet}
                onChange={(e) => setLinkKet(e.target.value)}
                placeholder="Keterangan singkat..."
                className="form-input"
                maxLength={255}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowLinkForm(false)} className="btn btn-sm bg-white text-gray-600 border border-gray-200">
              Batal
            </button>
            <button type="submit" disabled={savingLink || !linkUrl.trim()} className="btn-success btn-sm">
              {savingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              Simpan Link
            </button>
          </div>
        </form>
      )}

      {!loading && media.length === 0 && links.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">
          {bisaKelola
            ? "Belum ada dokumentasi. Unggah foto/video atau tempel link YouTube/Google Drive."
            : "Belum ada dokumentasi pada siklus ini."}
        </div>
      )}

      {!loading && (media.length > 0 || links.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Kartu link YouTube / Drive */}
          {links.map((l) => {
            const p = prov(l);
            return (
              <div key={l.id} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 aspect-[4/3]">
                {p.provider === "YOUTUBE" && p.providerId ? (
                  <button onClick={() => setLinkLihat(l)} className="relative w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${p.providerId}/hqdefault.jpg`}
                      alt={l.judul}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-red-600 text-white rounded-full p-2 shadow-lg">
                        <Film className="w-4 h-4" />
                      </span>
                    </span>
                  </button>
                ) : (
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex w-full h-full flex-col items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors">
                    <Link2 className="w-6 h-6" />
                    <span className="text-[10px] px-2 text-center line-clamp-2">{l.judul}</span>
                  </a>
                )}
                <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-black/60 text-white/90">
                  {p.provider === "YOUTUBE" ? "YouTube" : p.provider === "GDRIVE" ? "Drive" : "Link"}
                </span>
                {bisaKelola && (
                  <button
                    onClick={() => hapusLink(l)}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus link"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5">
                  <p className="text-white text-[10px] truncate">{l.judul}</p>
                </div>
              </div>
            );
          })}

          {/* Kartu file upload */}
          {media.map((m) => {
            const video = m.mime.startsWith("video/");
            return (
              <button
                key={m.id}
                onClick={() => setLightbox(m)}
                className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 aspect-[4/3] text-left"
                title={`${m.fileName} · ${fmtUkuran(m.ukuran)}`}
              >
                {video ? (
                  <video
                    src={m.url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    preload="metadata"
                    muted
                    playsInline
                  />
                ) : srcCache[m.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={srcCache[m.id]} alt={m.keterangan ?? m.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    <Camera className="w-6 h-6 animate-pulse" />
                  </div>
                )}
                {video && (
                  <span className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1">
                    <Film className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5">
                  <p className="text-white text-[10px] truncate">{m.keterangan ?? m.fileName}</p>
                  <p className="text-white/60 text-[9px]">{video ? "Video · " : ""}{fmtUkuran(m.ukuran)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{lightbox.keterangan ?? lightbox.fileName}</p>
                <p className="text-white/50 text-xs truncate">
                  {lightbox.fileName} · {fmtUkuran(lightbox.ukuran)} · oleh {lightbox.uploader}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {bisaKelola && (
                  <button
                    onClick={() => hapus(lightbox)}
                    className="btn btn-sm bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-400/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                )}
                <button onClick={() => setLightbox(null)} className="btn btn-sm bg-white/10 text-white hover:bg-white/20">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {lightbox.mime.startsWith("video/") ? (
              <video src={lightbox.url} controls autoPlay playsInline className="w-full max-h-[75vh] rounded-xl bg-black" />
            ) : (
              srcCache[lightbox.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={srcCache[lightbox.id]} alt={lightbox.keterangan ?? lightbox.fileName} className="w-full max-h-[75vh] object-contain rounded-xl" />
              )
            )}
          </div>
        </div>
      )}

      {/* Lightbox link YouTube / Drive */}
      {linkLihat && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setLinkLihat(null)}>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{linkLihat.judul}</p>
                <p className="text-white/50 text-xs truncate">
                  {linkLihat.keterangan ?? "Dokumentasi supervisi"} · oleh {linkLihat.uploader}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={linkLihat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm bg-white/10 text-white hover:bg-white/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Asli
                </a>
                <button onClick={() => setLinkLihat(null)} className="btn btn-sm bg-white/10 text-white hover:bg-white/20">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {(() => {
              const p = deteksiProvider(linkLihat.url);
              if (p.provider === "YOUTUBE" && p.providerId) {
                return (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${p.providerId}`}
                      title={linkLihat.judul}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                );
              }
              if (p.provider === "GDRIVE" && p.providerId) {
                return (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={`https://drive.google.com/file/d/${p.providerId}/preview`}
                      title={linkLihat.judul}
                      allow="autoplay"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                );
 }
              return (
                <div className="p-8 text-center bg-white/10 rounded-xl">
                  <p className="text-white/70 text-sm mb-3">Pratinjau tidak tersedia untuk link ini.</p>
                  <a href={linkLihat.url} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
                    <ExternalLink className="w-4 h-4" /> Buka Link
                  </a>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
