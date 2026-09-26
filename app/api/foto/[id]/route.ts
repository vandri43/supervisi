import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hapusFotoFile } from "@/lib/foto";
import { kirimMedia } from "@/lib/serve-media";

// GET /api/foto/[id] — kirim file media (hanya untuk user yang login).
// Guru hanya bisa melihat media siklusnya; supervisor/admin semua.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const media = await prisma.fotoSupervisi.findUnique({
    where: { id: params.id },
    include: { siklus: { select: { guruId: true } } },
  });
  if (!media) {
    return NextResponse.json({ error: "Media tidak ditemukan" }, { status: 404 });
  }

  const isPengawas = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";
  if (!isPengawas && media.siklus.guruId !== session.user.id) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    return await kirimMedia(req, media.storedName, media.mimeType);
  } catch {
    return NextResponse.json({ error: "File media tidak ditemukan di server" }, { status: 404 });
  }
}

// DELETE /api/foto/[id] — pengawas (uploader/admin) menghapus media
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const media = await prisma.fotoSupervisi.findUnique({ where: { id: params.id } });
  if (!media) {
    return NextResponse.json({ error: "Media tidak ditemukan" }, { status: 404 });
  }

  await prisma.fotoSupervisi.delete({ where: { id: params.id } });
  await hapusFotoFile(media.storedName);

  return NextResponse.json({ success: true });
}
