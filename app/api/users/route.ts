import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users — daftar pengguna (login required)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { nama: "asc" }],
    include: { sekolah: { select: { nama: true } } },
  });

  const data = users.map((u) => ({
    id: u.id,
    nama: u.nama,
    email: u.email,
    role: u.role,
    nip: u.nip,
    mapel: u.mapel,
    jabatan: u.jabatan,
    aktif: u.aktif,
    sekolahId: u.sekolahId,
    sekolahNama: u.sekolah?.nama ?? null,
  }));

  return NextResponse.json(data);
}

// POST /api/users — tambah pengguna baru (hanya ADMIN)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!nama) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  if (nama.length > 255) return NextResponse.json({ error: "Nama maksimal 255 karakter" }, { status: 400 });

  if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  }
  if (email.length > 255) return NextResponse.json({ error: "Email maksimal 255 karakter" }, { status: 400 });

  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  const role = body.role === "ADMIN" || body.role === "SUPERVISOR" || body.role === "GURU" ? body.role : "GURU";

  const nip = typeof body.nip === "string" && body.nip.trim() !== "" ? body.nip.trim() : null;
  if (nip && nip.length > 30) return NextResponse.json({ error: "NIP maksimal 30 karakter" }, { status: 400 });

  const mapel = typeof body.mapel === "string" && body.mapel.trim() !== "" ? body.mapel.trim() : null;
  if (mapel && mapel.length > 100) return NextResponse.json({ error: "Mapel maksimal 100 karakter" }, { status: 400 });

  const jabatan = typeof body.jabatan === "string" && body.jabatan.trim() !== "" ? body.jabatan.trim() : null;
  if (jabatan && jabatan.length > 100) return NextResponse.json({ error: "Jabatan maksimal 100 karakter" }, { status: 400 });

  const sekolahId = typeof body.sekolahId === "string" && body.sekolahId.trim() !== "" ? body.sekolahId : null;
  if (sekolahId) {
    const sekolah = await prisma.sekolah.findUnique({ where: { id: sekolahId } });
    if (!sekolah) return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: `Email ${email} sudah terdaftar` }, { status: 409 });
  }

  try {
    const created = await prisma.user.create({
      data: {
        nama,
        email,
        password: await bcrypt.hash(password, 12),
        role,
        nip,
        mapel: role === "GURU" ? mapel : mapel,
        jabatan,
        sekolahId,
        aktif: typeof body.aktif === "boolean" ? body.aktif : true,
      },
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
    }
    console.error("Gagal menambah pengguna:", e);
    return NextResponse.json({ error: "Gagal menambah pengguna" }, { status: 500 });
  }
}
