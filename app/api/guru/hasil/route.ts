import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// GET /api/guru/hasil — riwayat hasil supervisi guru yang login (tahun ajaran aktif; ?all=1 semua)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const showAll = req.nextUrl.searchParams.get("all") === "1";
  const tahunFilter: Record<string, string> = showAll
    ? {}
    : await getSettings().then((s) => ({ tahunAjaran: s.tahunAjaran, semester: s.semester }));

  // Guru hanya melihat siklusnya sendiri; ADMIN/SUPERVISOR melihat semua siklus guru
  const isPengawas = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";
  const siklus = await prisma.siklus.findMany({
    where: { ...(isPengawas ? {} : { guruId: session.user.id }), ...tahunFilter },
    orderBy: { createdAt: "desc" },
    include: {
      guru: { select: { nama: true } },
      supervisor: { select: { nama: true } },
      praObservasi: { include: { indikator: true } },
      observasiKelas: { include: { indikator: true } },
      pascaSupervisi: { include: { indikator: true, rtl: true } },
    },
  });

  const dimensiKeys = ["BBM", "3M", "Literasi", "Numerasi", "Asesmen"];

  const data = siklus.map((s) => {
    const skorRata = (indikator: { skor: number; dimensi?: string; komponen: string }[], maks: number) => {
      if (indikator.length === 0) return null;
      const total = indikator.reduce((a, i) => a + i.skor, 0);
      return maks > 0 ? Number(((total / maks) * 100).toFixed(1)) : null;
    };

    const praNilai = s.praObservasi ? skorRata(s.praObservasi.indikator, 180) : null;
    const obsNilai = s.observasiKelas ? skorRata(s.observasiKelas.indikator, 176) : null;
    const pascaNilai = s.pascaSupervisi ? skorRata(s.pascaSupervisi.indikator, 108) : null;

    // Rata-rata skor per dimensi dari indikator observasi (pakai field dimensi; fallback nama komponen)
    const dimensiAgg: Record<string, { total: number; count: number }> = {};
    for (const ind of s.observasiKelas?.indikator ?? []) {
      const dim =
        (ind as { dimensi?: string | null }).dimensi && dimensiKeys.includes((ind as { dimensi?: string | null }).dimensi as string)
          ? (ind as { dimensi?: string | null }).dimensi as string
          : dimensiKeys.find((k) => ind.komponen.toUpperCase().includes(k.toUpperCase()));
      const key = dim ?? "Umum";
      if (!dimensiAgg[key]) dimensiAgg[key] = { total: 0, count: 0 };
      dimensiAgg[key].total += ind.skor;
      dimensiAgg[key].count += 1;
    }
    const dimensi = Object.entries(dimensiAgg).map(([dim, v]) => ({
      dimensi: dim,
      // nilai dalam persen dari skor maksimum (count × 4)
      nilai: v.count > 0 ? Math.round((v.total / (v.count * 4)) * 100) : 0,
    }));

    const nilaiAkhir =
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
      kelas: s.kelas,
      mapel: s.mapel,
      topik: s.topikPembelajaran,
      guru: s.guru.nama,
      supervisor: s.supervisor.nama,
      tanggal: s.tanggalMulai,
      status: s.status,
      nilaiAkhir,
      predikat,
      komponenNilai: {
        praObservasi: praNilai,
        observasiKelas: obsNilai,
        pascaSupervisi: pascaNilai,
      },
      dimensi,
      rtl: (s.pascaSupervisi?.rtl ?? []).map((r) => ({
        id: r.id,
        aspek: r.aspek,
        rencana: r.rencana,
        status: r.statusMonitoring,
        deadline: r.deadline,
      })),
    };
  });

  return NextResponse.json(data);
}
