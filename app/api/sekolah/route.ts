import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sekolah — semua user yang sudah login bisa melihat daftar sekolah
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const [sekolah, roleCounts] = await Promise.all([
    prisma.sekolah.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.user.groupBy({
      by: ["sekolahId", "role"],
      where: { sekolahId: { not: null }, role: { in: ["GURU", "SUPERVISOR"] } },
      _count: { _all: true },
    }),
  ]);

  const guruCount = new Map<string, number>();
  const supervisorCount = new Map<string, number>();
  for (const g of roleCounts) {
    if (!g.sekolahId) continue;
    if (g.role === "GURU") guruCount.set(g.sekolahId, g._count._all);
    else supervisorCount.set(g.sekolahId, g._count._all);
  }

  const data = sekolah.map((s) => ({
    id: s.id,
    nama: s.nama,
    npsn: s.npsn,
    alamat: s.alamat,
    kecamatan: s.kecamatan,
    kabupaten: s.kabupaten,
    provinsi: s.provinsi,
    telepon: s.telepon,
    email: s.email,
    aktif: s.aktif,
    jumlahGuru: guruCount.get(s.id) ?? 0,
    jumlahSupervisor: supervisorCount.get(s.id) ?? 0,
  }));

  return NextResponse.json(data);
}

function validate(body: Record<string, unknown>) {
  const errors: string[] = [];
  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  if (!nama) errors.push("Nama sekolah wajib diisi");
  if (nama.length > 255) errors.push("Nama sekolah maksimal 255 karakter");

  const npsn = typeof body.npsn === "string" && body.npsn.trim() !== "" ? body.npsn.trim() : null;
  if (npsn && !/^\d{8}$/.test(npsn)) errors.push("NPSN harus 8 digit angka");

  const telepon = typeof body.telepon === "string" && body.telepon.trim() !== "" ? body.telepon.trim() : null;
  if (telepon && telepon.length > 20) errors.push("Nomor telepon maksimal 20 karakter");

  const email = typeof body.email === "string" && body.email.trim() !== "" ? body.email.trim() : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Format email tidak valid");
  if (email && email.length > 100) errors.push("Email maksimal 100 karakter");

  const alamat = typeof body.alamat === "string" && body.alamat.trim() !== "" ? body.alamat.trim() : null;
  const kecamatan = typeof body.kecamatan === "string" && body.kecamatan.trim() !== "" ? body.kecamatan.trim() : null;
  const kabupaten = typeof body.kabupaten === "string" && body.kabupaten.trim() !== "" ? body.kabupaten.trim() : null;
  const provinsi = typeof body.provinsi === "string" && body.provinsi.trim() !== "" ? body.provinsi.trim() : null;
  const aktif = typeof body.aktif === "boolean" ? body.aktif : true;

  return {
    errors,
    values: { nama, npsn, alamat, kecamatan, kabupaten, provinsi, telepon, email, aktif },
  };
}

// POST /api/sekolah — tambah sekolah baru (hanya ADMIN)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { errors, values } = validate(body as Record<string, unknown>);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  // Cegah NPSN duplikat
  if (values.npsn) {
    const exists = await prisma.sekolah.findUnique({ where: { npsn: values.npsn } });
    if (exists) {
      return NextResponse.json({ error: `Sekolah dengan NPSN ${values.npsn} sudah terdaftar` }, { status: 409 });
    }
  }

  try {
    const created = await prisma.sekolah.create({ data: values });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    // Unique constraint (race condition dengan request lain)
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "NPSN sudah digunakan sekolah lain" }, { status: 409 });
    }
    console.error("Gagal menyimpan sekolah:", e);
    return NextResponse.json({ error: "Gagal menyimpan sekolah" }, { status: 500 });
  }
}
