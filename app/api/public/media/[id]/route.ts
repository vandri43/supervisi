import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kirimMedia } from "@/lib/serve-media";

export const dynamic = "force-dynamic";

// GET /api/public/media/[id] — serve media untuk halaman depan (TANPA auth).
// Boleh publik jika:
//  1) diunggah supervisor/admin (dokumentasi supervisi), atau
//  2) diunggah guru DAN buktinya berstatus DITERIMA (sudah diverifikasi pengawas).
// Media guru yang masih MENUNGGU/DITOLAK tidak pernah tampil publik.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const media = await prisma.fotoSupervisi.findUnique({
    where: { id: params.id },
    include: { uploader: { select: { role: true } } },
  });
  if (!media) {
    return NextResponse.json({ error: "Media tidak ditemukan" }, { status: 404 });
  }

  const isPengawas = media.uploader.role === "ADMIN" || media.uploader.role === "SUPERVISOR";
  if (!isPengawas) {
    const buktiDiterima = await prisma.bukti.findFirst({
      where: { link: `/api/foto/${media.id}`, status: "DITERIMA" },
      select: { id: true },
    });
    if (!buktiDiterima) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }
  }

  try {
    return await kirimMedia(req, media.storedName, media.mimeType, true);
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan di server" }, { status: 404 });
  }
}
