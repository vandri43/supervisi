import { prisma } from "@/lib/prisma";
import { komponenPraObservasi, pertanyaanKonferensi } from "@/lib/instrumen/pra-observasi";
import { komponenObservasi } from "@/lib/instrumen/observasi-kelas";
import { komponenPasca } from "@/lib/instrumen/pasca-supervisi";

// Stage yang dikenali: "pra" | "observasi" | "pasca"
export type Stage = "pra" | "observasi" | "pasca";

export const STAGE_LIST: Stage[] = ["pra", "observasi", "pasca"];

export const LABEL_STAGE: Record<Stage, string> = {
  pra: "Pra Observasi (Telaah RPP/RPM)",
  observasi: "Observasi Kelas",
  pasca: "Pasca Supervisi",
};

export function isStage(v: string): v is Stage {
  return (STAGE_LIST as string[]).includes(v);
}

export interface IndikatorDb {
  id: string;
  no: number;
  deskripsi: string;
  dimensi: string | null;
  tagPM: string | null;
}

export interface KomponenDb {
  id: string;
  kode: string;
  judul: string;
  urutan: number;
  indikator: IndikatorDb[];
}

// Cache in-memory 60 detik per proses — mengurangi query berulang
let cache: { data: Partial<Record<Stage, KomponenDb[]>>; expire: number } = { data: {}, expire: 0 };
const CACHE_MS = 60_000;

// Seed sekali di awal dari definisi statis lama (40+38+27 indikator + konferensi)
// Anti-race: satu promise dibagi ke semua caller paralel dalam satu proses
let seeded = false;
let seedPromise: Promise<void> | null = null;
export function seedInstrumenJikaKosong(): Promise<void> {
  if (seeded) return Promise.resolve();
  if (!seedPromise) {
    seedPromise = doSeed()
      .then(() => {
        seeded = true;
      })
      .catch((e) => {
        console.error("Seed instrumen gagal:", e);
      })
      .finally(() => {
        seedPromise = null;
      });
  }
  return seedPromise;
}

async function doSeed(): Promise<void> {
  const count = await prisma.instrumenKomponen.count();
  if (count > 0) {
    seeded = true;
    return;
  }

    const seed: Record<Stage, { kode: string; judul: string; indikator: { no: number; deskripsi: string; dimensi?: string; tagPM?: string }[] }[]> = {
      pra: komponenPraObservasi,
      observasi: komponenObservasi,
      pasca: komponenPasca,
    };

  await prisma.$transaction(async (tx) => {
    for (const stage of STAGE_LIST) {
      let urutan = 0;
      for (const k of seed[stage]) {
        const komponen = await tx.instrumenKomponen.create({
          data: { stage, kode: k.kode, judul: k.judul, urutan: urutan++ },
        });
        await tx.instrumenIndikator.createMany({
          data: k.indikator.map((i, idx) => ({
            komponenId: komponen.id,
            nomor: i.no,
            deskripsi: i.deskripsi,
            dimensi: ("dimensi" in i ? i.dimensi : undefined) ?? null,
            tagPM: ("tagPM" in i ? i.tagPM : undefined) ?? null,
            urutan: idx,
          })),
        });
      }
    }
    await tx.instrumenKonferensi.createMany({
      data: pertanyaanKonferensi.map((p, idx) => ({ pertanyaan: p, urutan: idx })),
    });
  });
}

// Definisi statis lama — fallback bila DB kosong (seed gagal/belum jalan)
const STATIS: Record<Stage, KomponenDb[]> = {
  pra: komponenPraObservasi.map((k, ki) => ({
    id: `statis-${ki}`,
    kode: k.kode,
    judul: k.judul,
    urutan: ki,
    indikator: k.indikator.map((i) => ({ id: "", no: i.no, deskripsi: i.deskripsi, dimensi: null, tagPM: ("tagPM" in i ? i.tagPM : undefined) ?? null })),
  })),
  observasi: komponenObservasi.map((k, ki) => ({
    id: `statis-${ki}`,
    kode: k.kode,
    judul: k.judul,
    urutan: ki,
    indikator: k.indikator.map((i) => ({ id: "", no: i.no, deskripsi: i.deskripsi, dimensi: ("dimensi" in i ? i.dimensi : null) ?? null, tagPM: null })),
  })),
  pasca: komponenPasca.map((k, ki) => ({
    id: `statis-${ki}`,
    kode: k.kode,
    judul: k.judul,
    urutan: ki,
    indikator: k.indikator.map((i) => ({ id: "", no: i.no, deskripsi: i.deskripsi, dimensi: null, tagPM: null })),
  })),
};

// Muat seluruh instrumen satu stage dari DB; fallback ke definisi statis bila DB kosong
export async function ambilInstrumen(stage: Stage, forceFresh = false): Promise<KomponenDb[]> {
  // Seed selalu dicek (murah: 1 query count, di-guard flag) — juga saat forceFresh
  await seedInstrumenJikaKosong();
  if (!forceFresh) {
    const now = Date.now();
    if (cache.expire > now && cache.data[stage]) {
      return cache.data[stage] as KomponenDb[];
    }
  }

  const komponen = await prisma.instrumenKomponen.findMany({
    where: { stage },
    orderBy: [{ urutan: "asc" }, { kode: "asc" }],
    include: {
      indikator: {
        orderBy: [{ urutan: "asc" }, { nomor: "asc" }],
      },
    },
  });

  const data: KomponenDb[] = komponen.map((k) => ({
    id: k.id,
    kode: k.kode,
    judul: k.judul,
    urutan: k.urutan,
    indikator: k.indikator.map((i) => ({
      id: i.id,
      no: i.nomor,
      deskripsi: i.deskripsi,
      dimensi: i.dimensi,
      tagPM: i.tagPM,
    })),
  }));

  if (!forceFresh) {
    cache.data[stage] = data;
    cache.expire = Date.now() + CACHE_MS;
  }
  // Fallback: DB kosong (seed belum sukses) → pakai definisi statis agar aplikasi tetap berfungsi
  if (data.length === 0) {
    return STATIS[stage];
  }
  return data;
}

// Kosongkan cache (dipanggil setelah admin mengubah instrumen)
export function resetCacheInstrumen(): void {
  cache = { data: {}, expire: 0 };
}

// Ambil pertanyaan konferensi dari DB (fallback ke array statis jika kosong)
export async function ambilKonferensi(): Promise<string[]> {
  await seedInstrumenJikaKosong();
  const rows = await prisma.instrumenKonferensi.findMany({ orderBy: { urutan: "asc" } });
  return rows.length > 0 ? rows.map((r) => r.pertanyaan) : pertanyaanKonferensi;
}

// Peta "A-1" -> { deskripsi, dimensi } dari data DB (untuk route PUT stage & cetak)
export function petaInstrumen(komponen: KomponenDb[]): Map<string, { deskripsi: string; dimensi: string }> {
  const map = new Map<string, { deskripsi: string; dimensi: string }>();
  for (const k of komponen) {
    for (const i of k.indikator) {
      map.set(`${k.kode}-${i.no}`, {
        deskripsi: i.deskripsi,
        dimensi: i.dimensi ?? "Umum",
      });
    }
  }
  return map;
}

// Skor maksimum stage = jumlah indikator × 4
export function skorMaks(komponen: KomponenDb[]): number {
  return komponen.reduce((a, k) => a + k.indikator.length, 0) * 4;
}

// Nilai akhir & predikat dari total skor
export function hitungNilai(totalSkor: number, maks: number): { nilaiAkhir: number; predikat: "KURANG" | "CUKUP" | "BAIK" | "SANGAT_BAIK" } {
  const nilaiAkhir = maks > 0 ? (totalSkor / maks) * 100 : 0;
  const predikat = nilaiAkhir >= 91 ? "SANGAT_BAIK" : nilaiAkhir >= 81 ? "BAIK" : nilaiAkhir >= 71 ? "CUKUP" : "KURANG";
  return { nilaiAkhir, predikat };
}
