import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// GET /api/sekolah/[id] — detail satu sekolah
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const [sekolah, jumlahGuru, jumlahSupervisor] = await Promise.all([
    prisma.sekolah.findUnique({ where: { id: params.id } }),
    prisma.user.count({ where: { sekolahId: params.id, role: "GURU" } }),
    prisma.user.count({ where: { sekolahId: params.id, role: "SUPERVISOR" } }),
  ]);

  if (!sekolah) {
    return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    id: sekolah.id,
    nama: sekolah.nama,
    npsn: sekolah.npsn,
    alamat: sekolah.alamat,
    kecamatan: sekolah.kecamatan,
    kabupaten: sekolah.kabupaten,
    provinsi: sekolah.provinsi,
    telepon: sekolah.telepon,
    email: sekolah.email,
    aktif: sekolah.aktif,
    jumlahGuru,
    jumlahSupervisor,
  });
}

// PUT /api/sekolah/[id] — edit sekolah (hanya ADMIN)
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const existing = await prisma.sekolah.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  if (!nama) {
    return NextResponse.json({ error: "Nama sekolah wajib diisi" }, { status: 400 });
  }
  if (nama.length > 255) {
    return NextResponse.json({ error: "Nama sekolah maksimal 255 karakter" }, { status: 400 });
  }

  const npsn = typeof body.npsn === "string" && body.npsn.trim() !== "" ? body.npsn.trim() : null;
  if (npsn && !/^\d{8}$/.test(npsn)) {
    return NextResponse.json({ error: "NPSN harus 8 digit angka" }, { status: 400 });
  }

  const telepon = typeof body.telepon === "string" && body.telepon.trim() !== "" ? body.telepon.trim() : null;
  if (telepon && telepon.length > 20) {
    return NextResponse.json({ error: "Nomor telepon maksimal 20 karakter" }, { status: 400 });
  }

  const email = typeof body.email === "string" && body.email.trim() !== "" ? body.email.trim() : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  }
  if (email && email.length > 100) {
    return NextResponse.json({ error: "Email maksimal 100 karakter" }, { status: 400 });
  }

  // Cegah NPSN duplikat (kecuali milik sekolah ini sendiri)
  if (npsn && npsn !== existing.npsn) {
    const dup = await prisma.sekolah.findUnique({ where: { npsn } });
    if (dup) {
      return NextResponse.json({ error: `NPSN ${npsn} sudah digunakan sekolah lain` }, { status: 409 });
    }
  }

  try {
    const updated = await prisma.sekolah.update({
      where: { id: params.id },
      data: {
        nama,
        npsn,
        alamat: typeof body.alamat === "string" && body.alamat.trim() !== "" ? body.alamat.trim() : null,
        kecamatan: typeof body.kecamatan === "string" && body.kecamatan.trim() !== "" ? body.kecamatan.trim() : null,
        kabupaten: typeof body.kabupaten === "string" && body.kabupaten.trim() !== "" ? body.kabupaten.trim() : null,
        provinsi: typeof body.provinsi === "string" && body.provinsi.trim() !== "" ? body.provinsi.trim() : null,
        telepon,
        email,
        aktif: typeof body.aktif === "boolean" ? body.aktif : existing.aktif,
      },
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "NPSN sudah digunakan sekolah lain" }, { status: 409 });
    }
    console.error("Gagal memperbarui sekolah:", e);
    return NextResponse.json({ error: "Gagal memperbarui sekolah" }, { status: 500 });
  }
}

// DELETE /api/sekolah/[id] — hapus sekolah (hanya ADMIN)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const userCount = await prisma.user.count({ where: { sekolahId: params.id } });
  if (userCount > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus: masih ada ${userCount} pengguna yang terhubung ke sekolah ini` },
      { status: 409 }
    );
  }

  const siklusCount = await prisma.siklus.count({ where: { sekolahId: params.id } });
  if (siklusCount > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus: masih ada ${siklusCount} siklus supervisi pada sekolah ini` },
      { status: 409 }
    );
  }

  try {
    await prisma.sekolah.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }
    console.error("Gagal menghapus sekolah:", e);
    return NextResponse.json({ error: "Gagal menghapus sekolah" }, { status: 500 });
  }
}
