import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/public/sk — daftar dokumen SK untuk halaman depan (TANPA auth).
// Hanya metadata ringan; file fisik disajikan via /api/public/sk/[id].
// Cache in-memory 60 detik — endpoint ini diakses setiap pengunjung halaman login.
let cacheResp: { data: unknown; expire: number } | null = null;
const CACHE_MS = 60_000;

export async function GET() {
  if (cacheResp && cacheResp.expire > Date.now()) {
    return NextResponse.json(cacheResp.data);
  }

  const sk = await prisma.dokumenSk.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 12,
    select: {
      id: true,
      judul: true,
      mimeType: true,
      keterangan: true,
      ukuran: true,
      createdAt: true,
    },
  });

  const payload = {
    ada: sk.length > 0,
    jumlah: sk.length,
    items: sk.map((d) => ({
      id: d.id,
      judul: d.judul,
      tipe: d.mimeType === "application/pdf" ? "pdf" : "gambar",
      url: `/api/public/sk/${d.id}`,
      keterangan: d.keterangan,
      createdAt: d.createdAt,
    })),
  };

  cacheResp = { data: payload, expire: Date.now() + CACHE_MS };
  return NextResponse.json(payload);
}
