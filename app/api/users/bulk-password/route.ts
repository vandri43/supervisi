import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/users/bulk-password — ganti password massal (hanya ADMIN)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((v: unknown) => typeof v === "string") : [];
  const password: string = typeof body.password === "string" ? body.password : "";

  if (ids.length === 0) {
    return NextResponse.json({ error: "Pilih minimal satu pengguna" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    const result = await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { password: hashed },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (e) {
    console.error("Gagal memperbarui password massal:", e);
    return NextResponse.json({ error: "Gagal memperbarui password" }, { status: 500 });
  }
}
