import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/public/galeri — galeri dokumentasi untuk halaman depan (TANPA auth).
// Isi: semua media (foto/video) yang diunggah supervisor/admin + foto/video bukti
// milik guru yang SUDAH DIVERIFIKASI (status DITERIMA). Nama guru tidak ditampilkan.
// Cache in-memory 60 detik — galeri login diakses semua pengunjung
let cacheResp: { data: unknown; expire: number } | null = null;
const CACHE_MS = 60_000;

export async function GET() {
  if (cacheResp && cacheResp.expire > Date.now()) {
    return NextResponse.json(cacheResp.data);
  }

  const [mediaPengawas, mediaGuruSemua, buktiDiterima, linkPengawas] = await Promise.all([
    prisma.fotoSupervisi.findMany({
      where: { uploader: { role: { in: ["ADMIN", "SUPERVISOR"] } } },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: { siklus: { select: { topikPembelajaran: true } } },
    }),
    prisma.fotoSupervisi.findMany({
      where: { uploader: { role: "GURU" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { siklus: { select: { topikPembelajaran: true } } },
    }),
    prisma.bukti.findMany({
      where: {
        status: "DITERIMA",
        jenis: { in: ["FOTO_KEGIATAN", "VIDEO_PEMBELAJARAN"] },
        link: { startsWith: "/api/foto/" },
      },
      select: { link: true },
    }),
    prisma.mediaLink.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { siklus: { select: { topikPembelajaran: true } } },
    }),
  ]);

  // Hanya media guru yang punya bukti DITERIMA (link persis /api/foto/{id})
  const linkDiterima = new Set(buktiDiterima.map((b) => b.link));
  const mediaGuru = mediaGuruSemua.filter((m) => linkDiterima.has(`/api/foto/${m.id}`));

  const map = new Map<
    string,
    { id: string; mime: string; sumber: "pengawas" | "guru"; topik: string | null; createdAt: Date }
  >();
  for (const m of mediaPengawas) {
    map.set(m.id, {
      id: m.id,
      mime: m.mimeType,
      sumber: "pengawas",
      topik: m.siklus.topikPembelajaran,
      createdAt: m.createdAt,
    });
  }
  for (const m of mediaGuru) {
    if (!map.has(m.id)) {
      map.set(m.id, {
        id: m.id,
        mime: m.mimeType,
        sumber: "guru",
        topik: m.siklus.topikPembelajaran,
        createdAt: m.createdAt,
      });
    }
  }

  // Link dokumentasi supervisor (YouTube/Drive) masuk galeri publik
  type GaleriRaw = {
    id: string;
    url: string;
    provider: string | null;
    providerId: string | null;
    tipe: "foto" | "video" | "link";
    sumber: "pengawas" | "guru";
    topik: string | null;
    createdAt: Date;
  };

  const itemLinks: GaleriRaw[] = linkPengawas.map((l) => ({
    id: `link-${l.id}`,
    url: l.url,
    provider: l.provider,
    providerId: l.providerId,
    tipe: "link",
    sumber: "pengawas",
    topik: l.siklus.topikPembelajaran,
    createdAt: l.createdAt,
  }));

  const itemFiles: GaleriRaw[] = Array.from(map.values()).map((m) => ({
    id: m.id,
    url: `/api/public/media/${m.id}`,
    provider: null,
    providerId: null,
    tipe: m.mime.startsWith("video/") ? "video" : "foto",
    sumber: m.sumber,
    topik: m.topik,
    createdAt: m.createdAt,
  }));

  const items = [...itemFiles, ...itemLinks]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 24)
    .map((m) => ({
      id: m.id,
      url: m.url,
      provider: m.provider,
      providerId: m.providerId,
      tipe: m.tipe,
      sumber: m.sumber,
      topik: m.topik,
    }));

  const payload = { ada: items.length > 0, jumlah: items.length, items };
  cacheResp = { data: payload, expire: Date.now() + CACHE_MS };
  return NextResponse.json(payload);
}
