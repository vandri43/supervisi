import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings, updateSettings, AppSettings } from "@/lib/settings";

// Wajib dinamis: tanpa ini Next.js meng-prerender GET sebagai statis saat build,
// sehingga PUT ke route ini ditolak 405 dan perubahan setting tidak pernah live.
export const dynamic = "force-dynamic";

// GET settings — publik agar halaman login bisa menampilkan branding
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

// PUT settings — hanya ADMIN
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { appName, appTagline, logoUrl, footerText, tahunAjaran, semester } = body as Partial<AppSettings>;

  if (appName !== undefined && (typeof appName !== "string" || appName.trim().length === 0 || appName.length > 100)) {
    return NextResponse.json({ error: "Nama aplikasi wajib diisi (maks 100 karakter)" }, { status: 400 });
  }
  if (appTagline !== undefined && (typeof appTagline !== "string" || appTagline.length > 200)) {
    return NextResponse.json({ error: "Tagline maks 200 karakter" }, { status: 400 });
  }
  if (logoUrl !== undefined && logoUrl !== null && (typeof logoUrl !== "string" || logoUrl.length > 500)) {
    return NextResponse.json({ error: "URL logo maks 500 karakter" }, { status: 400 });
  }
  if (footerText !== undefined && footerText !== null && (typeof footerText !== "string" || footerText.length > 200)) {
    return NextResponse.json({ error: "Teks footer maks 200 karakter" }, { status: 400 });
  }
  if (tahunAjaran !== undefined) {
    if (typeof tahunAjaran !== "string" || !/^\d{4}\/\d{4}$/.test(tahunAjaran)) {
      return NextResponse.json({ error: "Tahun ajaran harus format 2025/2026" }, { status: 400 });
    }
  }
  if (semester !== undefined && semester !== "GANJIL" && semester !== "GENAP") {
    return NextResponse.json({ error: "Semester harus GANJIL atau GENAP" }, { status: 400 });
  }

  const updated = await updateSettings({
    appName: appName?.trim(),
    appTagline: appTagline?.trim(),
    logoUrl: logoUrl === "" ? null : logoUrl,
    footerText: footerText === "" ? null : footerText,
    tahunAjaran,
    semester,
  });

  return NextResponse.json(updated);
}
