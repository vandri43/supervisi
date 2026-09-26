import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedInstrumenJikaKosong } from "@/lib/instrumen-db";

export const dynamic = "force-dynamic";

// GET /api/public/statistik — data publik untuk halaman login (TANPA auth).
// Hanya mengembalikan hasil siklus yang sudah ada tahap selesai.
// NAMA GURU DISAMARKAN: dipetakan ke "Guru 1", "Guru 2", ... (stabil, tidak
// bisa ditelusuri ke identitas asli). Tidak ada nama/email/NIP di respons.

const PREDIKAT_LABEL: Record<string, string> = {
  SANGAT_BAIK: "Sangat Baik",
  BAIK: "Baik",
  CUKUP: "Cukup",
  KURANG: "Kurang",
};

const bulatkan = (n: number) => Number(n.toFixed(1));

// Cache in-memory 60 detik — halaman login sering diakses, DB tidak dipukul berulang
let cacheResp: { data: unknown; expire: number } | null = null;
const CACHE_MS = 60_000;

export async function GET() {
  if (cacheResp && cacheResp.expire > Date.now()) {
    return NextResponse.json(cacheResp.data);
  }

  // Sekalian memastikan instrumen tersimpan di DB (murah: 1 count query, di-guard flag)
  await seedInstrumenJikaKosong();

  const siklus = await prisma.siklus.findMany({
    where: {
      OR: [
        { praObservasi: { selesai: true } },
        { observasiKelas: { selesai: true } },
        { pascaSupervisi: { selesai: true } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      guruId: true,
      mapel: true,
      guru: { select: { nama: true } },
      praObservasi: { select: { nilaiAkhir: true, predikat: true, selesai: true } },
      observasiKelas: { select: { nilaiAkhir: true, predikat: true, selesai: true } },
      pascaSupervisi: { select: { nilaiAkhir: true, predikat: true, selesai: true } },
    },
  });

  if (siklus.length === 0) {
    const kosong = { ada: false, perGuru: [], agregat: null };
    cacheResp = { data: kosong, expire: Date.now() + CACHE_MS };
    return NextResponse.json(kosong);
  }

  // --- Anonimisasi: nama unik diurutkan alfabetis lalu dipetakan ke label tetap
  const namaUnik = Array.from(new Set(siklus.map((s) => s.guru.nama))).sort((a, b) =>
    a.localeCompare(b)
  );
  const labelMap = new Map(namaUnik.map((nama, i) => [nama, `Guru ${i + 1}`]));

  interface GuruStat {
    label: string;
    mapel: string | null;
    pra: number | null;
    observasi: number | null;
    pasca: number | null;
    nilai: number | null;
    predikat: string | null;
  }
  const perGuruMap = new Map<string, GuruStat>();

  // Agregasi rata-rata per tahap (dari seluruh siklus yang tahapnya selesai)
  const tahapAgg = {
    pra: { total: 0, count: 0 },
    observasi: { total: 0, count: 0 },
    pasca: { total: 0, count: 0 },
  };

  for (const s of siklus) {
    const pra = s.praObservasi?.selesai ? s.praObservasi.nilaiAkhir : null;
    const observasi = s.observasiKelas?.selesai ? s.observasiKelas.nilaiAkhir : null;
    const pasca = s.pascaSupervisi?.selesai ? s.pascaSupervisi.nilaiAkhir : null;

    if (pra !== null) {
      tahapAgg.pra.total += pra;
      tahapAgg.pra.count += 1;
    }
    if (observasi !== null) {
      tahapAgg.observasi.total += observasi;
      tahapAgg.observasi.count += 1;
    }
    if (pasca !== null) {
      tahapAgg.pasca.total += pasca;
      tahapAgg.pasca.count += 1;
    }

    // Nilai akhir siklus = dari tahap terjauh yang selesai
    const nilai = pasca ?? observasi ?? pra;
    const predikat =
      pasca !== null
        ? s.pascaSupervisi?.predikat
        : observasi !== null
        ? s.observasiKelas?.predikat
        : s.praObservasi?.predikat;

    // Siklus terbaru tiap guru menang (siklus sudah diurutkan createdAt desc)
    if (!perGuruMap.has(s.guruId)) {
      perGuruMap.set(s.guruId, {
        label: labelMap.get(s.guru.nama) ?? "Guru",
        mapel: s.mapel,
        pra: pra !== null ? bulatkan(pra) : null,
        observasi: observasi !== null ? bulatkan(observasi) : null,
        pasca: pasca !== null ? bulatkan(pasca) : null,
        nilai: nilai !== null ? bulatkan(nilai) : null,
        predikat: predikat ?? null,
      });
    }
  }

  const perGuru = Array.from(perGuruMap.values())
    .filter((g) => g.nilai !== null)
    .sort((a, b) => (b.nilai ?? 0) - (a.nilai ?? 0));

  const nilaiSemua = perGuru.map((g) => g.nilai as number);
  const rataRata = nilaiSemua.length > 0 ? bulatkan(nilaiSemua.reduce((a, n) => a + n, 0) / nilaiSemua.length) : null;
  const tertinggi = nilaiSemua.length > 0 ? Math.max(...nilaiSemua) : null;
  const terendah = nilaiSemua.length > 0 ? Math.min(...nilaiSemua) : null;

  const distribusiPredikat = ["SANGAT_BAIK", "BAIK", "CUKUP", "KURANG"].map((p) => ({
    predikat: p,
    label: PREDIKAT_LABEL[p],
    jumlah: perGuru.filter((g) => g.predikat === p).length,
  }));

  const payload = {
    ada: true as const,
    perGuru,
    agregat: {
      rataRata,
      tertinggi,
      terendah,
      jumlahGuru: perGuru.length,
      jumlahSiklus: siklus.length,
      rataRataTahap: {
        pra: tahapAgg.pra.count > 0 ? bulatkan(tahapAgg.pra.total / tahapAgg.pra.count) : null,
        observasi:
          tahapAgg.observasi.count > 0 ? bulatkan(tahapAgg.observasi.total / tahapAgg.observasi.count) : null,
        pasca: tahapAgg.pasca.count > 0 ? bulatkan(tahapAgg.pasca.total / tahapAgg.pasca.count) : null,
      },
      distribusiPredikat,
    },
  };
  cacheResp = { data: payload, expire: Date.now() + CACHE_MS };
  return NextResponse.json(payload);
}
