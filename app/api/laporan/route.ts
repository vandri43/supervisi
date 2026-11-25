import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// GET /api/laporan?ta=2025/2026&semester=GANJIL — rekap supervisi (supervisor/admin)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  if (session.user.role !== "SUPERVISOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const ta = sp.get("ta");
  const semester = sp.get("semester");
  const where: Record<string, unknown> = {};
  if (ta) where.tahunAjaran = ta;
  if (semester === "GANJIL" || semester === "GENAP") where.semester = semester;

  const siklus = await prisma.siklus.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      guru: { select: { id: true, nama: true, mapel: true } },
      praObservasi: { include: { indikator: true } },
      observasiKelas: { include: { indikator: true } },
      pascaSupervisi: { select: { nilaiAkhir: true, predikat: true, selesai: true } },
    },
  });

  // Jika satu guru punya lebih dari satu siklus dalam tahun ajaran+semester yang sama,
  // tampilkan hanya yang terbaru (createdAt terbesar) — siklus lama yg sudah diganti
  // tidak ikut masuk rekap.
  const latestPerGuru = new Map<string, typeof siklus[0]>();
  for (const s of siklus) {
    const key = `${s.guruId}-${s.tahunAjaran}-${s.semester}`;
    if (!latestPerGuru.has(key)) {
      latestPerGuru.set(key, s); // sudah diurutkan desc, jadi index pertama = terbaru
    }
  }
  const siklusFiltered = Array.from(latestPerGuru.values());

  const skorRata = (indikator: { skor: number }[], maks: number) => {
    if (indikator.length === 0) return null;
    const total = indikator.reduce((a, i) => a + i.skor, 0);
    return maks > 0 ? Number(((total / maks) * 100).toFixed(1)) : null;
  };

  const rekap = siklusFiltered.map((s) => {
    // Hitung nilai dari indikator langsung (sama seperti dashboard)
    // agar konsisten meski tahap belum di-"selesai"kan
    const praVal = s.praObservasi ? skorRata(s.praObservasi.indikator, 180) : null;
    const obsVal = s.observasiKelas ? skorRata(s.observasiKelas.indikator, 176) : null;
    const pascaVal = s.pascaSupervisi?.selesai ? s.pascaSupervisi.nilaiAkhir : null;

    // Nilai akhir = dari tahap terjauh yang sudah ada data
    const nilaiAkhir = pascaVal ?? obsVal ?? praVal;
    const predikat =
      s.pascaSupervisi?.selesai
        ? s.pascaSupervisi.predikat
        : nilaiAkhir !== null
        ? nilaiAkhir >= 91 ? "SANGAT_BAIK" : nilaiAkhir >= 81 ? "BAIK" : nilaiAkhir >= 71 ? "CUKUP" : "KURANG"
        : null;

    return {
      id: s.id,
      nama: s.guru.nama,
      guruId: s.guru.id,
      mapel: s.mapel ?? s.guru.mapel,
      kelas: s.kelas,
      topik: s.topikPembelajaran,
      status: s.status,
      pra: praVal,
      observasi: obsVal,
      pasca: pascaVal,
      nilaiAkhir,
      predikat,
      tahunAjaran: s.tahunAjaran,
      semester: s.semester,
    };
  });

  // Rata-rata dimensi dari seluruh indikator observasi (pakai field dimensi; fallback nama komponen untuk data lama)
  const dimAgg: Record<string, { total: number; count: number }> = {};
  const dimKeys = ["BBM", "3M", "Literasi", "Numerasi", "Asesmen"];
  for (const s of siklusFiltered) {
    for (const ind of s.observasiKelas?.indikator ?? []) {
      const dim =
        (ind as { dimensi?: string | null }).dimensi &&
        dimKeys.includes((ind as { dimensi?: string | null }).dimensi as string)
        ? (ind as { dimensi?: string | null }).dimensi as string
        : dimKeys.find((k) => ind.komponen.toUpperCase().includes(k.toUpperCase())) ?? "Umum";
      if (!dimAgg[dim]) dimAgg[dim] = { total: 0, count: 0 };
      dimAgg[dim].total += ind.skor;
      dimAgg[dim].count += 1;
    }
  }
  const dimensiRadar = Object.entries(dimAgg).map(([dim, v]) => ({
    dimensi: dim,
    nilai: v.count > 0 ? Math.round((v.total / (v.count * 4)) * 100) : 0,
  }));

  // Distribusi predikat dari siklus yang sudah selesai
  const distribusiPredikat = ["KURANG", "CUKUP", "BAIK", "SANGAT_BAIK"].map((p) => ({
    predikat:
      p === "KURANG" ? "Kurang" : p === "CUKUP" ? "Cukup" : p === "BAIK" ? "Baik" : "Sangat Baik",
    jumlah: siklusFiltered.filter((s) => s.pascaSupervisi?.selesai && s.pascaSupervisi.predikat === p).length,
  }));

  // Daftar tahun ajaran untuk filter: tahun yang punya siklus + tahun ajaran aktif,
  // sehingga tahun baru yang belum punya data tetap bisa dipilih.
  const [taRows, settings] = await Promise.all([
    prisma.siklus.findMany({
      distinct: ["tahunAjaran"],
      select: { tahunAjaran: true },
    }),
    getSettings(),
  ]);
  const taSet = new Set<string>(taRows.map((t) => t.tahunAjaran));
  taSet.add(settings.tahunAjaran);
  const taList = Array.from(taSet).sort().reverse();

  return NextResponse.json({
    rekap,
    dimensiRadar,
    distribusiPredikat,
    taList,
    taAktif: settings.tahunAjaran,
    semesterAktif: settings.semester,
  });
}
