import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile — data akun user yang login
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { sekolah: { select: { id: true, nama: true, npsn: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    nip: user.nip,
    jabatan: user.jabatan,
    mapel: user.mapel,
    aktif: user.aktif,
    createdAt: user.createdAt,
    sekolah: user.sekolah,
  });
}

// PUT /api/profile — ubah profil sendiri (nama, jabatan, mapel) & password
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.nama === "string" && body.nama.trim() !== "") {
    if (body.nama.trim().length > 255) {
      return NextResponse.json({ error: "Nama maksimal 255 karakter" }, { status: 400 });
    }
    data.nama = body.nama.trim();
  }
  if (typeof body.jabatan === "string") {
    data.jabatan = body.jabatan.trim() || null;
  }
  if (typeof body.mapel === "string") {
    data.mapel = body.mapel.trim() || null;
  }

  // Ganti password: wajib password lama benar
  if (body.passwordBaru) {
    if (typeof body.passwordBaru !== "string" || body.passwordBaru.length < 8) {
      return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
    }
    if (!body.passwordLama || typeof body.passwordLama !== "string") {
      return NextResponse.json({ error: "Password lama wajib diisi" }, { status: 400 });
    }
    const cocok = await bcrypt.compare(body.passwordLama, user.password);
    if (!cocok) {
      return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
    }
    data.password = await bcrypt.hash(body.passwordBaru, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  try {
    await prisma.user.update({ where: { id: session.user.id }, data });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Gagal memperbarui profil:", e);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
