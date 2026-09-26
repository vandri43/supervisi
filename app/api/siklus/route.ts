import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { kirimNotifikasi } from "@/lib/notifikasi";

// GET /api/siklus — daftar siklus milik supervisor yang login
// (ADMIN melihat semua, GURU melihat siklus dirinya)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const role = session.user.role;

  // Filter tahun ajaran aktif — semua menu hanya menampilkan data tahun berjalan.
  // ?all=1 untuk melihat semua tahun (mis. dari halaman laporan).
  const showAll = req.nextUrl.searchParams.get("all") === "1";
  const settings = showAll ? null : await getSettings();
  const tahunFilter: Record<string, string> = settings
    ? { tahunAjaran: settings.tahunAjaran, semester: settings.semester }
    : {};

  const where =
    role === "ADMIN"
      ? { ...tahunFilter }
      : role === "SUPERVISOR"
      ? { supervisorId: session.user.id, ...tahunFilter }
      : { guruId: session.user.id, ...tahunFilter };

  const siklus = await prisma.siklus.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      guru: { select: { id: true, nama: true } },
      supervisor: { select: { id: true, nama: true } },
      sekolah: { select: { id: true, nama: true } },
      praObservasi: {
        select: {
          nilaiAkhir: true,
          predikat: true,
          selesai: true,
          totalSkor: true,
          _count: { select: { indikator: { where: { skor: { gt: 0 } } } } },
        },
      },
      observasiKelas: {
        select: {
          nilaiAkhir: true,
          predikat: true,
          selesai: true,
          totalSkor: true,
          _count: { select: { indikator: { where: { skor: { gt: 0 } } } } },
        },
      },
      pascaSupervisi: {
        select: {
          nilaiAkhir: true,
          predikat: true,
          selesai: true,
          totalSkor: true,
          _count: { select: { indikator: { where: { skor: { gt: 0 } } }, rtl: true } },
          rtl: { where: { statusMonitoring: "SELESAI" }, select: { id: true } },
        },
      },
    },
  });

  const data = siklus.map((s) => {
    // Nilai akhir siklus diambil dari pasca (jika ada), fallback observasi → pra
    const nilai =
      s.pascaSupervisi?.selesai
        ? s.pascaSupervisi.nilaiAkhir
        : s.observasiKelas?.selesai
        ? s.observasiKelas.nilaiAkhir
        : s.praObservasi?.selesai
        ? s.praObservasi.nilaiAkhir
        : null;
    const predikat =
      s.pascaSupervisi?.selesai
        ? s.pascaSupervisi.predikat
        : s.observasiKelas?.selesai
        ? s.observasiKelas.predikat
        : s.praObservasi?.selesai
        ? s.praObservasi.predikat
        : null;

    return {
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
      nilaiAkhir: nilai,
      predikat,
      praSelesai: s.praObservasi?.selesai ?? false,
      praDiisi: s.praObservasi?._count.indikator ?? 0,
      praSkor: s.praObservasi?.totalSkor ?? 0,
      obsSelesai: s.observasiKelas?.selesai ?? false,
      obsDiisi: s.observasiKelas?._count.indikator ?? 0,
      obsSkor: s.observasiKelas?.totalSkor ?? 0,
      pascaSelesai: s.pascaSupervisi?.selesai ?? false,
      pascaDiisi: s.pascaSupervisi?._count.indikator ?? 0,
      pascaSkor: s.pascaSupervisi?.totalSkor ?? 0,
      rtlTotal: s.pascaSupervisi?._count.rtl ?? 0,
      rtlSelesai: s.pascaSupervisi?.rtl.length ?? 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  });

  return NextResponse.json(data);
}

// POST /api/siklus — buat siklus baru (SUPERVISOR / ADMIN)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR" && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const guruId = typeof body.guruId === "string" ? body.guruId.trim() : "";
  if (!guruId) {
    return NextResponse.json({ error: "Guru yang disupervisi wajib dipilih" }, { status: 400 });
  }

  const guru = await prisma.user.findUnique({ where: { id: guruId } });
  if (!guru) {
    return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 400 });
  }

  // Tahun ajaran siklus baru = tahun ajaran aktif dari pengaturan (bukan input bebas)
  const settings = await getSettings();
  const tahunAjaran = settings.tahunAjaran;
  const semester = settings.semester === "GENAP" ? "GENAP" : "GANJIL";

  const kelas = typeof body.kelas === "string" && body.kelas.trim() !== "" ? body.kelas.trim() : null;
  if (kelas && kelas.length > 20) {
    return NextResponse.json({ error: "Kelas maksimal 20 karakter" }, { status: 400 });
  }

  const mapel =
    typeof body.mapel === "string" && body.mapel.trim() !== ""
      ? body.mapel.trim()
      : guru.mapel ?? null;
  if (mapel && mapel.length > 100) {
    return NextResponse.json({ error: "Mata pelajaran maksimal 100 karakter" }, { status: 400 });
  }

  const topikPembelajaran =
    typeof body.topikPembelajaran === "string" && body.topikPembelajaran.trim() !== ""
      ? body.topikPembelajaran.trim()
      : null;
  if (topikPembelajaran && topikPembelajaran.length > 255) {
    return NextResponse.json({ error: "Topik maksimal 255 karakter" }, { status: 400 });
  }

  const catatan =
    typeof body.catatan === "string" && body.catatan.trim() !== "" ? body.catatan.trim() : null;

  let tanggalMulai: Date | null = null;
  if (typeof body.tanggalMulai === "string" && body.tanggalMulai.trim() !== "") {
    tanggalMulai = new Date(body.tanggalMulai);
    if (isNaN(tanggalMulai.getTime())) {
      return NextResponse.json({ error: "Tanggal mulai tidak valid" }, { status: 400 });
    }
  }

  // Sekolah siklus: prioritas sekolah guru, fallback sekolah supervisor
  const sekolahId = guru.sekolahId ?? session.user.sekolahId ?? null;
  if (!sekolahId) {
    return NextResponse.json(
      { error: "Guru belum memiliki sekolah. Atur di menu Kelola Pengguna atau Kelola Sekolah dahulu." },
      { status: 400 }
    );
  }

  const supervisorId = session.user.id;

  try {
    const created = await prisma.siklus.create({
      data: {
        tahunAjaran,
        semester,
        status: "DRAFT",
        kelas,
        mapel,
        topikPembelajaran,
        tanggalMulai,
        catatan,
        supervisorId,
        guruId,
        sekolahId,
      },
    });

    // Beri tahu guru bahwa ia mendapat jadwal supervisi
    await kirimNotifikasi({
      userId: guruId,
      judul: "Jadwal Supervisi Baru",
      pesan: `Anda dijadwalkan supervisi oleh ${session.user.name}${topikPembelajaran ? ` — topik: ${topikPembelajaran}` : ""}.`,
      tipe: "supervisi",
      link: `/guru/hasil`,
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    console.error("Gagal membuat siklus:", e);
    return NextResponse.json({ error: "Gagal membuat siklus" }, { status: 500 });
  }
}
