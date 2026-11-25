import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// GET /api/dashboard — statistik sesuai role user yang login (filter tahun ajaran aktif)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const role = session.user.role;
  const settings = await getSettings();
  const tahunAktif: { tahunAjaran: string; semester: "GANJIL" | "GENAP" } = {
    tahunAjaran: settings.tahunAjaran,
    semester: settings.semester === "GENAP" ? "GENAP" : "GANJIL",
  };
  const infoTahun = { tahunAjaran: settings.tahunAjaran, semester: tahunAktif.semester };

  // ===== ADMIN: rekap seluruh sistem =====
  if (role === "ADMIN") {
    const [totalSekolah, totalUsers, totalSiklus, selesai, berjalan, guruCount, supervisorCount] =
      await Promise.all([
        prisma.sekolah.count(),
        prisma.user.count(),
        prisma.siklus.count({ where: tahunAktif }),
        prisma.siklus.count({ where: { status: "SELESAI", ...tahunAktif } }),
        prisma.siklus.count({ where: { status: { notIn: ["SELESAI", "DRAFT"] }, ...tahunAktif } }),
        prisma.user.count({ where: { role: "GURU" } }),
        prisma.user.count({ where: { role: "SUPERVISOR" } }),
      ]);

    // Distribusi predikat dari pasca supervisi yang selesai (tahun aktif)
    const pascaSelesai = await prisma.pascaSupervisi.findMany({
      where: { selesai: true, siklus: tahunAktif },
      select: { predikat: true },
    });
    const pieData = ["SANGAT_BAIK", "BAIK", "CUKUP", "KURANG"].map((p) => ({
      name: p === "SANGAT_BAIK" ? "Sangat Baik" : p === "BAIK" ? "Baik" : p === "CUKUP" ? "Cukup" : "Kurang",
      value: pascaSelesai.filter((x) => x.predikat === p).length,
      color:
        p === "SANGAT_BAIK" ? "#2dce89" : p === "BAIK" ? "#5e72e4" : p === "CUKUP" ? "#fb6340" : "#f5365c",
    }));

    // Tren siklus per bulan (6 bulan terakhir) berdasarkan createdAt
    const siklusAll = await prisma.siklus.findMany({
      select: { createdAt: true, status: true },
      where: { createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } },
    });
    const bulanNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const areaData: { bulan: string; selesai: number; proses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const inMonth = siklusAll.filter((s) => s.createdAt >= d && s.createdAt < next);
      areaData.push({
        bulan: bulanNames[d.getMonth()],
        selesai: inMonth.filter((s) => s.status === "SELESAI").length,
        proses: inMonth.filter((s) => s.status !== "SELESAI").length,
      });
    }

    // Siklus terbaru (tahun aktif)
    const recent = await prisma.siklus.findMany({
      where: tahunAktif,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        guru: { select: { nama: true } },
        sekolah: { select: { nama: true } },
        pascaSupervisi: { select: { nilaiAkhir: true, selesai: true } },
      },
    });
    const recentSiklus = recent.map((s) => ({
      id: s.id,
      guru: s.guru.nama,
      sekolah: s.sekolah?.nama ?? "-",
      mapel: s.mapel ?? "-",
      status: s.status,
      nilai: s.pascaSupervisi?.selesai ? s.pascaSupervisi.nilaiAkhir : null,
    }));

    // Performa per sekolah (siklus tahun aktif saja)
    const sekolahList = await prisma.sekolah.findMany({
      include: {
        siklus: {
          where: tahunAktif,
          include: { pascaSupervisi: { select: { nilaiAkhir: true, selesai: true } } },
        },
      },
    });
    const sekolahStats = sekolahList
      .map((sk) => {
        const total = sk.siklus.length;
        const selesaiSkl = sk.siklus.filter((s) => s.pascaSupervisi?.selesai);
        const avg =
          selesaiSkl.length > 0
            ? Number(
                (selesaiSkl.reduce((a, s) => a + (s.pascaSupervisi?.nilaiAkhir ?? 0), 0) / selesaiSkl.length).toFixed(1)
              )
            : 0;
        return { nama: sk.nama, total, selesai: selesaiSkl.length, avg };
      })
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      role,
      tahunAktif: infoTahun,
      stats: {
        totalSekolah,
        totalUsers,
        guruCount,
        supervisorCount,
        totalSiklus,
        selesai,
        berjalan,
      },
      areaData,
      pieData,
      recentSiklus,
      sekolahStats,
    });
  }

  // ===== SUPERVISOR: rekap guru binaan =====
  if (role === "SUPERVISOR") {
    const siklus = await prisma.siklus.findMany({
      where: { supervisorId: session.user.id, ...tahunAktif },
      include: {
        guru: { select: { id: true, nama: true, mapel: true } },
        pascaSupervisi: { select: { nilaiAkhir: true, selesai: true } },
        observasiKelas: { include: { indikator: { select: { komponen: true, skor: true } } } },
      },
    });

    const selesai = siklus.filter((s) => s.status === "SELESAI").length;
    const berjalan = siklus.filter((s) => !["SELESAI", "DRAFT"].includes(s.status)).length;
    const guruBinaan = new Set(siklus.map((s) => s.guru.id)).size;

    // Nilai akhir per guru (dari siklus selesai)
    const barMap = new Map<string, number>();
    for (const s of siklus) {
      if (s.pascaSupervisi?.selesai) {
        barMap.set(s.guru.nama, s.pascaSupervisi.nilaiAkhir);
      }
    }
    const barData = Array.from(barMap.entries()).map(([nama, nilai]) => ({
      nama: nama.split(",")[0],
      nilai,
    }));

    // Rata-rata dimensi dari seluruh indikator observasi
    const dimKeys = ["BBM", "3M", "Literasi", "Numerasi", "Asesmen", "Umum"];
    const dimAgg: Record<string, { total: number; count: number }> = {};
    for (const s of siklus) {
      for (const ind of s.observasiKelas?.indikator ?? []) {
        const dim = dimKeys.find((k) => ind.komponen.toUpperCase().includes(k.toUpperCase())) ?? "Umum";
        if (!dimAgg[dim]) dimAgg[dim] = { total: 0, count: 0 };
        dimAgg[dim].total += ind.skor;
        dimAgg[dim].count += 1;
      }
    }
    const radarData = Object.entries(dimAgg).map(([dim, v]) => ({
      dimensi: dim,
      nilai: v.count > 0 ? Math.round((v.total / (v.count * 4)) * 100) : 0,
    }));

    // Daftar guru binaan dengan status siklus terbarunya
    const guruMap = new Map<string, { nama: string; mapel: string | null; status: string; nilai: number | null; predikat: string | null; updatedAt: Date }>();
    for (const s of siklus) {
      const existing = guruMap.get(s.guru.id);
      const nilai = s.pascaSupervisi?.selesai ? s.pascaSupervisi.nilaiAkhir : (existing?.nilai ?? null);
      if (!existing || s.updatedAt > existing.updatedAt) {
        guruMap.set(s.guru.id, {
          nama: s.guru.nama,
          mapel: s.guru.mapel,
          status: s.status,
          nilai,
          predikat: null,
          updatedAt: s.updatedAt,
        });
      }
    }
    const guruList = Array.from(guruMap.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
      .map((g) => ({
        nama: g.nama,
        mapel: g.mapel ?? "-",
        status: g.status,
        nilai: g.nilai,
        lastUpdate: formatRelatif(g.updatedAt),
      }));

    return NextResponse.json({
      role,
      tahunAktif: infoTahun,
      stats: { guruBinaan, berjalan, selesai, totalSiklus: siklus.length },
      radarData,
      barData,
      guruList,
    });
  }

  // ===== GURU: ringkasan pribadi =====
  const siklus = await prisma.siklus.findMany({
    where: { guruId: session.user.id, ...tahunAktif },
    orderBy: { createdAt: "desc" },
    include: {
      praObservasi: { include: { indikator: { select: { komponen: true, skor: true } } } },
      observasiKelas: { include: { indikator: { select: { komponen: true, skor: true } } } },
      pascaSupervisi: { select: { nilaiAkhir: true, selesai: true } },
    },
  });

  const latest = siklus[0] ?? null;
  const nilaiTerakhir = latest
    ? latest.pascaSupervisi?.selesai
      ? latest.pascaSupervisi.nilaiAkhir
      : latest.observasiKelas?.selesai
      ? latest.observasiKelas.nilaiAkhir
      : latest.praObservasi?.selesai
      ? latest.praObservasi.nilaiAkhir
      : null
    : null;

  // Profil dimensi dari observasi terakhir
  let radarData: { dimensi: string; nilai: number }[] = [];
  if (latest?.observasiKelas) {
    const dimKeys = ["BBM", "3M", "Literasi", "Numerasi", "Asesmen", "Umum"];
    const agg: Record<string, { total: number; count: number }> = {};
    for (const ind of latest.observasiKelas.indikator) {
      const dim = dimKeys.find((k) => ind.komponen.toUpperCase().includes(k.toUpperCase())) ?? "Umum";
      if (!agg[dim]) agg[dim] = { total: 0, count: 0 };
      agg[dim].total += ind.skor;
      agg[dim].count += 1;
    }
    radarData = Object.entries(agg).map(([dim, v]) => ({
      dimensi: dim,
      nilai: v.count > 0 ? Math.round((v.total / (v.count * 4)) * 100) : 0,
    }));
  }

  // Skor per komponen pra observasi terakhir (persentase per komponen)
  let komponenPra: { label: string; nilai: number }[] = [];
  if (latest?.praObservasi) {
    const byKomponen = new Map<string, { total: number; count: number }>();
    for (const ind of latest.praObservasi.indikator) {
      const kode = ind.komponen;
      if (!byKomponen.has(kode)) byKomponen.set(kode, { total: 0, count: 0 });
      const cur = byKomponen.get(kode)!;
      cur.total += ind.skor;
      cur.count += 1;
    }
    komponenPra = Array.from(byKomponen.entries()).map(([kode, v]) => ({
      label: `Komponen ${kode}`,
      nilai: v.count > 0 ? Math.round((v.total / (v.count * 4)) * 100) : 0,
    }));
  }

  // Tren nilai per siklus selesai (urut lama → baru)
  const trendData = siklus
    .filter((s) => s.pascaSupervisi?.selesai)
    .reverse()
    .map((s) => ({
      semester: `${s.semester === "GANJIL" ? "G" : "Gen"} ${s.tahunAjaran.slice(2, 7)}`,
      nilai: s.pascaSupervisi?.nilaiAkhir ?? 0,
    }));

  // RTL milik guru (tahun aktif)
  const rtlRows = await prisma.rencanaTindakLanjut.findMany({
    where: { pascaSupervisi: { siklus: { guruId: session.user.id, ...tahunAktif } } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, aspek: true, rencana: true, deadline: true, statusMonitoring: true },
  });

  return NextResponse.json({
    role,
    tahunAktif: infoTahun,
    stats: {
      totalSiklus: siklus.length,
      selesai: siklus.filter((s) => s.status === "SELESAI").length,
      rtlBerjalan: rtlRows.filter((r) => r.statusMonitoring !== "SELESAI").length,
      rtlSelesai: rtlRows.filter((r) => r.statusMonitoring === "SELESAI").length,
    },
    nilaiTerakhir,
    latestInfo: latest
      ? {
          topik: latest.topikPembelajaran,
          mapel: latest.mapel,
          kelas: latest.kelas,
          tahunAjaran: latest.tahunAjaran,
          semester: latest.semester,
        }
      : null,
    radarData,
    trendData,
    komponenPra,
    rtlList: rtlRows.map((r) => ({
      aspek: r.aspek,
      rencana: r.rencana,
      status: r.statusMonitoring,
      deadline: r.deadline,
    })),
  });
}

function formatRelatif(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const hari = Math.floor(diffMs / 86400000);
  if (hari === 0) return "Hari ini";
  if (hari === 1) return "Kemarin";
  if (hari < 30) return `${hari} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
