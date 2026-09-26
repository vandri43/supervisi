import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kirimNotifikasi } from "@/lib/notifikasi";
import { deteksiProvider } from "@/lib/media-link";

export const dynamic = "force-dynamic";

// GET /api/siklus/[id]/media-link — daftar link dokumentasi siklus (user login)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const media = await prisma.mediaLink.findMany({
    where: { siklusId: params.id },
    orderBy: { createdAt: "desc" },
    include: { uploader: { select: { nama: true } } },
  });

  return NextResponse.json(
    media.map((m) => ({
      id: m.id,
      judul: m.judul,
      url: m.url,
      provider: m.provider,
      providerId: m.providerId,
      keterangan: m.keterangan,
      uploader: m.uploader.nama,
      createdAt: m.createdAt,
    }))
  );
}

// POST /api/siklus/[id]/media-link — tambah link dokumentasi (supervisor/admin)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Hanya supervisor/admin yang bisa menambah link dokumentasi" }, { status: 403 });
  }

  const siklus = await prisma.siklus.findUnique({
    where: { id: params.id },
    select: { id: true, guruId: true, topikPembelajaran: true },
  });
  if (!siklus) {
    return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const judul = typeof body?.judul === "string" ? body.judul.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const keterangan = typeof body?.keterangan === "string" ? body.keterangan.trim() : "";

  if (!url) {
    return NextResponse.json({ error: "Link wajib diisi" }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Link tidak valid. Contoh: https://youtube.com/watch?v=..." }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Link harus dimulai dengan http:// atau https://" }, { status: 400 });
  }

  const { provider, providerId } = deteksiProvider(url);

  const media = await prisma.mediaLink.create({
    data: {
      siklusId: params.id,
      uploaderId: session.user.id,
      judul: judul || (provider === "YOUTUBE" ? "Video YouTube" : provider === "GDRIVE" ? "Dokumen Google Drive" : "Dokumentasi"),
      url,
      provider,
      providerId,
      keterangan: keterangan || null,
    },
  });

  await kirimNotifikasi({
    userId: siklus.guruId,
    judul: "Dokumentasi Supervisi Baru",
    pesan: `Supervisor menambahkan dokumentasi "${media.judul}"${siklus.topikPembelajaran ? ` pada supervisi "${siklus.topikPembelajaran}"` : ""}.`,
    tipe: "supervisi",
    link: "/guru/hasil",
  });

  return NextResponse.json({ success: true, id: media.id }, { status: 201 });
}

// DELETE /api/siklus/[id]/media-link?linkId=xxx — hapus link dokumentasi
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const linkId = req.nextUrl.searchParams.get("linkId") ?? "";
  if (!linkId) {
    return NextResponse.json({ error: "linkId wajib diisi" }, { status: 400 });
  }

  const media = await prisma.mediaLink.findUnique({ where: { id: linkId } });
  if (!media || media.siklusId !== params.id) {
    return NextResponse.json({ error: "Link dokumentasi tidak ditemukan" }, { status: 404 });
  }

  await prisma.mediaLink.delete({ where: { id: linkId } });
  return NextResponse.json({ success: true });
}
