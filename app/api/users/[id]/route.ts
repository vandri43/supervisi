import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// PUT /api/users/[id] — edit pengguna (hanya ADMIN)
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  if (!nama) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  }

  if (email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) {
      return NextResponse.json({ error: `Email ${email} sudah digunakan pengguna lain` }, { status: 409 });
    }
  }

  const role = body.role === "ADMIN" || body.role === "SUPERVISOR" || body.role === "GURU" ? body.role : existing.role;

  // Lindungi admin terakhir agar tidak turun role / dinonaktifkan
  if (existing.role === "ADMIN" && (role !== "ADMIN" || body.aktif === false)) {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN", aktif: true } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Minimal harus ada satu admin aktif" }, { status: 409 });
    }
  }

  const sekolahId = typeof body.sekolahId === "string" && body.sekolahId.trim() !== "" ? body.sekolahId : null;
  if (sekolahId && sekolahId !== existing.sekolahId) {
    const sekolah = await prisma.sekolah.findUnique({ where: { id: sekolahId } });
    if (!sekolah) return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 400 });
  }

  // Password opsional saat edit: kosongkan = tidak diubah
  const password = typeof body.password === "string" ? body.password : "";
  if (password && password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: params.id },
      data: {
        nama,
        email,
        role,
        nip: typeof body.nip === "string" && body.nip.trim() !== "" ? body.nip.trim() : null,
        mapel: typeof body.mapel === "string" && body.mapel.trim() !== "" ? body.mapel.trim() : null,
        jabatan: typeof body.jabatan === "string" && body.jabatan.trim() !== "" ? body.jabatan.trim() : null,
        sekolahId,
        aktif: typeof body.aktif === "boolean" ? body.aktif : existing.aktif,
        ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
      },
    });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
    }
    console.error("Gagal memperbarui pengguna:", e);
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — hapus pengguna (hanya ADMIN)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  }

  // Tidak boleh menghapus diri sendiri
  if (session.user?.id === params.id) {
    return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 409 });
  }

  // Lindungi admin terakhir
  if (existing.role === "ADMIN" && existing.aktif) {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN", aktif: true } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Minimal harus ada satu admin aktif" }, { status: 409 });
    }
  }

  const siklusCount = await prisma.siklus.count({
    where: { OR: [{ supervisorId: params.id }, { guruId: params.id }] },
  });
  if (siklusCount > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus: pengguna masih terhubung dengan ${siklusCount} siklus supervisi. Nonaktifkan saja.` },
      { status: 409 }
    );
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    console.error("Gagal menghapus pengguna:", e);
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}
