import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifikasi — daftar notifikasi user yang login (15 terbaru + jumlah belum dibaca)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const [items, belumDibaca] = await Promise.all([
    prisma.notifikasi.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.notifikasi.count({ where: { userId: session.user.id, dibaca: false } }),
  ]);

  return NextResponse.json({ items, belumDibaca });
}

// PUT /api/notifikasi — tandai dibaca (satu id, atau semua jika id tidak dikirim)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;

  await prisma.notifikasi.updateMany({
    where: { userId: session.user.id, ...(id ? { id } : {}) },
    data: { dibaca: true },
  });

  return NextResponse.json({ success: true });
}
