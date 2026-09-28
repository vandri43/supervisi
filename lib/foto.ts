import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Direktori penyimpanan media (di luar folder public agar hanya bisa diakses
// lewat API dengan otentikasi). Bisa dioverride via env FOTO_DIR.
export const FOTO_DIR = process.env.FOTO_DIR || "/var/www/supervisi-guru/uploads/foto-supervisi";

// Foto dikompres di sisi browser menjadi < 1MB; server menoleransi hingga 2MB.
export const FOTO_MAX_UKURAN = 2 * 1024 * 1024;
// Video (foto kegiatan bergerak) maksimal 50 MB.
export const VIDEO_MAX_UKURAN = 50 * 1024 * 1024;

const MIME_DIIZINKAN: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

const MIME_VIDEO_DIIZINKAN: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export function mimeDiizinkan(mime: string): boolean {
  return mime in MIME_DIIZINKAN;
}

export function mimeVideoDiizinkan(mime: string): boolean {
  return mime in MIME_VIDEO_DIIZINKAN;
}

export function isVideo(mime: string): boolean {
  return mime.startsWith("video/");
}

// =============================================
// DOKUMEN SK (SURAT KEPUTUSAN) — PDF atau gambar
// Disimpan di folder terpisah, dipublikasikan ke halaman login via API.
// =============================================
export const SK_DIR = process.env.SK_DIR || "/var/www/supervisi-guru/uploads/dokumen-sk";
// PDF biasanya lebih besar dari foto; 10 MB cukup longgar untuk scan SK.
export const SK_MAX_UKURAN = 10 * 1024 * 1024;

const MIME_SK_DIIZINKAN: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function mimeSkDiizinkan(mime: string): boolean {
  return mime in MIME_SK_DIIZINKAN;
}

export function isPdf(mime: string): boolean {
  return mime === "application/pdf";
}

// Simpan buffer SK ke disk (folder SK), kembalikan nama file acak & aman
export async function simpanSk(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = MIME_SK_DIIZINKAN[mimeType] ?? ".pdf";
  await mkdir(SK_DIR, { recursive: true });
  const storedName = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`;
  await writeFile(path.join(SK_DIR, storedName), buffer);
  return storedName;
}

// Hapus file SK dari disk (abaikan error jika file sudah tidak ada)
export async function hapusSkFile(storedName: string): Promise<void> {
  try {
    await unlink(path.join(SK_DIR, storedName));
  } catch {
    // file mungkin sudah terhapus — abaikan
  }
}

// Simpan buffer media ke disk, kembalikan nama file tersimpan yang acak & aman
export async function simpanFoto(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = MIME_DIIZINKAN[mimeType] ?? MIME_VIDEO_DIIZINKAN[mimeType] ?? ".jpg";
  await mkdir(FOTO_DIR, { recursive: true });
  const storedName = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`;
  await writeFile(path.join(FOTO_DIR, storedName), buffer);
  return storedName;
}

// Hapus file media dari disk (abaikan error jika file sudah tidak ada)
export async function hapusFotoFile(storedName: string): Promise<void> {
  try {
    await unlink(path.join(FOTO_DIR, storedName));
  } catch {
    // file mungkin sudah terhapus — abaikan
  }
}

// Baca file media dari disk untuk dikirim via API
export async function bacaFotoFile(storedName: string): Promise<Buffer> {
  // storedName dibuat sistem (bukan user) tapi tetap divalidasi ketat
  if (!/^[a-zA-Z0-9._-]+$/.test(storedName) || storedName.includes("..")) {
    throw new Error("Nama file tidak valid");
  }
  return readFile(path.join(FOTO_DIR, storedName));
}
