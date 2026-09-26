import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

async function getSiklusForSession(id: string, sessionId: string, role?: string) {
  const siklus = await prisma.siklus.findUnique({
    where: { id },
    include: {
      guru: { select: { id: true, nama: true, email: true, nip: true, jabatan: true, mapel: true } },
      supervisor: { select: { id: true, nama: true, email: true, nip: true, jabatan: true } },
      sekolah: { select: { id: true, nama: true, npsn: true, kabupaten: true, provinsi: true } },
      praObservasi: true,
      observasiKelas: true,
      pascaSupervisi: {
        include: { rtl: true },
      },
    },
  });

  if (!siklus) return { notFound: true as const };
  const bolehLihat =
    role === "ADMIN" || siklus.supervisorId === sessionId || siklus.guruId === sessionId;
  if (!bolehLihat) return { forbidden: true as const };
  return { siklus };
}

// GET /api/siklus/[id] — detail siklus
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const res = await getSiklusForSession(params.id, session.user.id, session.user?.role);
  if ("notFound" in res) {
    return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  }
  if ("forbidden" in res) {
    return NextResponse.json({ error: "Anda tidak memiliki akses ke siklus ini" }, { status: 403 });
  }

  const s = res.siklus;
  return NextResponse.json({
    id: s.id,
    tahunAjaran: s.tahunAjaran,
    semester: s.semester,
    status: s.status,
    kelas: s.kelas,
    mapel: s.mapel,
    topikPembelajaran: s.topikPembelajaran,
    tanggalMulai: s.tanggalMulai,
    tanggalSelesai: s.tanggalSelesai,
    catatan: s.catatan,
    guru: s.guru,
    supervisor: s.supervisor,
    sekolah: s.sekolah,
    praObservasi: s.praObservasi && {
      id: s.praObservasi.id,
      tanggal: s.praObservasi.tanggal,
      totalSkor: s.praObservasi.totalSkor,
      nilaiAkhir: s.praObservasi.nilaiAkhir,
      predikat: s.praObservasi.predikat,
      selesai: s.praObservasi.selesai,
      catatanUmum: s.praObservasi.catatanUmum,
    },
    observasiKelas: s.observasiKelas && {
      id: s.observasiKelas.id,
      tanggal: s.observasiKelas.tanggal,
      totalSkor: s.observasiKelas.totalSkor,
      skorMaks: s.observasiKelas.skorMaks,
      nilaiAkhir: s.observasiKelas.nilaiAkhir,
      predikat: s.observasiKelas.predikat,
      selesai: s.observasiKelas.selesai,
      catatanUmum: s.observasiKelas.catatanUmum,
    },
    pascaSupervisi: s.pascaSupervisi && {
      id: s.pascaSupervisi.id,
      tanggal: s.pascaSupervisi.tanggal,
      totalSkor: s.pascaSupervisi.totalSkor,
      nilaiAkhir: s.pascaSupervisi.nilaiAkhir,
      predikat: s.pascaSupervisi.predikat,
      selesai: s.pascaSupervisi.selesai,
      catatanUmum: s.pascaSupervisi.catatanUmum,
      rtl: s.pascaSupervisi.rtl,
    },
  });
}

// PUT /api/siklus/[id] — edit data siklus (supervisor pemilik / admin)
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR" && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const existing = await prisma.siklus.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  }
  if (existing.supervisorId !== session.user.id && session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses ke siklus ini" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.tahunAjaran === "string") {
    const ta = body.tahunAjaran.trim();
    if (!/^\d{4}\/\d{4}$/.test(ta)) {
      return NextResponse.json({ error: "Tahun ajaran harus format 2025/2026" }, { status: 400 });
    }
    data.tahunAjaran = ta;
  }
  if (body.semester === "GANJIL" || body.semester === "GENAP") data.semester = body.semester;
  if (typeof body.kelas === "string") data.kelas = body.kelas.trim() || null;
  if (typeof body.mapel === "string") data.mapel = body.mapel.trim() || null;
  if (typeof body.topikPembelajaran === "string") {
    data.topikPembelajaran = body.topikPembelajaran.trim() || null;
  }
  if (typeof body.catatan === "string") data.catatan = body.catatan.trim() || null;
  if (typeof body.tanggalMulai === "string") {
    data.tanggalMulai = body.tanggalMulai.trim() === "" ? null : new Date(body.tanggalMulai);
  }
  if (typeof body.tanggalSelesai === "string") {
    data.tanggalSelesai = body.tanggalSelesai.trim() === "" ? null : new Date(body.tanggalSelesai);
  }

  // Ganti guru yang disupervisi
  if (typeof body.guruId === "string" && body.guruId.trim() !== "" && body.guruId !== existing.guruId) {
    const guru = await prisma.user.findUnique({ where: { id: body.guruId } });
    if (!guru) return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 400 });
    data.guruId = guru.id;
    if (guru.sekolahId) data.sekolahId = guru.sekolahId;
  }

  // Transisi status manual (misal batal/kembali ke draft)
  const validStatus = ["DRAFT", "PRA_OBSERVASI", "OBSERVASI", "PASCA_SUPERVISI", "SELESAI"] as const;
  if (typeof body.status === "string" && (validStatus as readonly string[]).includes(body.status)) {
    data.status = body.status;
  }

  try {
    await prisma.siklus.update({ where: { id: params.id }, data });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Gagal memperbarui siklus:", e);
    return NextResponse.json({ error: "Gagal memperbarui siklus" }, { status: 500 });
  }
}

// DELETE /api/siklus/[id] — hapus siklus (supervisor pemilik / admin)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR" && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const existing = await prisma.siklus.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  }
  if (existing.supervisorId !== session.user.id && session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses ke siklus ini" }, { status: 403 });
  }

  try {
    await prisma.siklus.delete({ where: { id: params.id } }); // detail ikut terhapus (cascade)
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Gagal menghapus siklus:", e);
    return NextResponse.json({ error: "Gagal menghapus siklus" }, { status: 500 });
  }
}
