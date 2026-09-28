import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kirimSk } from "@/lib/serve-sk";

export const dynamic = "force-dynamic";

// GET /api/public/sk/[id] — serve file dokumen SK (TANPA auth).
// PDF dikirim inline (terbuka otomatis di tab/iframe), gambar tampil langsung.
// Dokumen SK memang dipublikasikan untuk pengunjung halaman login.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const dok = await prisma.dokumenSk.findUnique({
    where: { id: params.id },
    select: { storedName: true, mimeType: true },
  });
  if (!dok) {
    return NextResponse.json({ error: "Dokumen SK tidak ditemukan" }, { status: 404 });
  }

  try {
    return await kirimSk(dok.storedName, dok.mimeType);
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan di server" }, { status: 404 });
  }
}
