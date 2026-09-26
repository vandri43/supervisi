import { prisma } from "@/lib/prisma";

export interface AppSettings {
  appName: string;
  appTagline: string;
  logoUrl: string | null;
  footerText: string | null;
  tahunAjaran: string;
  semester: string;
}

export const DEFAULTS: AppSettings = {
  appName: "Supervisi Guru",
  appTagline: "Sistem Supervisi Pembelajaran Mendalam",
  logoUrl: null,
  footerText: null,
  tahunAjaran: "2025/2026",
  semester: "GANJIL",
};

// Ambil settings dari DB dengan fallback default (aman dipanggil di server component)
export async function getSettings(): Promise<AppSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { id: "app" } });
    if (!row) return DEFAULTS;
    return {
      appName: row.appName || DEFAULTS.appName,
      appTagline: row.appTagline || DEFAULTS.appTagline,
      logoUrl: row.logoUrl,
      footerText: row.footerText,
      tahunAjaran: row.tahunAjaran || DEFAULTS.tahunAjaran,
      semester: row.semester || DEFAULTS.semester,
    };
  } catch {
    // DB belum siap / tabel belum ada — jangan crash halaman publik
    return DEFAULTS;
  }
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  const row = await prisma.setting.upsert({
    where: { id: "app" },
    update: {
      appName: data.appName ?? undefined,
      appTagline: data.appTagline ?? undefined,
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
      footerText: data.footerText !== undefined ? data.footerText : undefined,
      tahunAjaran: data.tahunAjaran ?? undefined,
      semester: data.semester ?? undefined,
    },
    create: {
      id: "app",
      appName: data.appName ?? DEFAULTS.appName,
      appTagline: data.appTagline ?? DEFAULTS.appTagline,
      logoUrl: data.logoUrl ?? null,
      footerText: data.footerText ?? null,
      tahunAjaran: data.tahunAjaran ?? DEFAULTS.tahunAjaran,
      semester: data.semester ?? DEFAULTS.semester,
    },
  });
  return {
    appName: row.appName,
    appTagline: row.appTagline,
    logoUrl: row.logoUrl,
    footerText: row.footerText,
    tahunAjaran: row.tahunAjaran,
    semester: row.semester,
  };
}
