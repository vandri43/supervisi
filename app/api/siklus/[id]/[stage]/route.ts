import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kirimNotifikasi } from "@/lib/notifikasi";
import { ambilInstrumen, ambilKonferensi, petaInstrumen, skorMaks, hitungNilai, type Stage } from "@/lib/instrumen-db";

const STAGE_API: Record<string, Stage> = {
  "pra-observasi": "pra",
  observasi: "observasi",
  pasca: "pasca",
};

// Muat instrumen stage dari DB (cache 60 detik); fallback aman bila stage tak dikenal
async function instrumenMap(stage: string) {
  const st = STAGE_API[stage];
  if (!st) return new Map<string, { deskripsi: string; dimensi: string }>();
  const komponen = await ambilInstrumen(st);
  return petaInstrumen(komponen);
}

type Params = { params: { id: string; stage: string } };

async function authorizeSiklus(siklusId: string, sessionId: string, role?: string) {
  const siklus = await prisma.siklus.findUnique({
    where: { id: siklusId },
    include: {
      guru: { select: { id: true, nama: true, email: true, nip: true, jabatan: true, mapel: true } },
      supervisor: { select: { id: true, nama: true } },
      sekolah: { select: { id: true, nama: true } },
    },
  });
  if (!siklus) return { notFound: true as const };
  const boleh = role === "ADMIN" || siklus.supervisorId === sessionId || siklus.guruId === sessionId;
  if (!boleh) return { forbidden: true as const };
  return { siklus };
}

function stageConfig(stage: string) {
  switch (stage) {
    case "pra-observasi":
      return {
        model: "praObservasi" as const,
        indikatorModel: "praIndikator" as const,
        fkField: "praObservasiId" as const,
        nextStatus: "PRA_OBSERVASI" as const,
        doneStatus: "OBSERVASI" as const,
      };
    case "observasi":
      return {
        model: "observasiKelas" as const,
        indikatorModel: "observasiIndikator" as const,
        fkField: "observasiKelasId" as const,
        nextStatus: "OBSERVASI" as const,
        doneStatus: "PASCA_SUPERVISI" as const,
      };
    case "pasca":
      return {
        model: "pascaSupervisi" as const,
        indikatorModel: "pascaIndikator" as const,
        fkField: "pascaSupervisiId" as const,
        nextStatus: "PASCA_SUPERVISI" as const,
        doneStatus: "SELESAI" as const,
      };
    default:
      return null;
  }
}

// GET /api/siklus/[id]/[stage] — muat data tahapan untuk diisi form
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const res = await authorizeSiklus(params.id, session.user.id, session.user?.role);
  if ("notFound" in res) return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  if ("forbidden" in res) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const s = res.siklus;
  const base = {
    siklus: {
      id: s.id,
      status: s.status,
      guru: s.guru,
      supervisor: s.supervisor,
      sekolah: s.sekolah,
      kelas: s.kelas,
      mapel: s.mapel,
      topikPembelajaran: s.topikPembelajaran,
      tahunAjaran: s.tahunAjaran,
      semester: s.semester,
    },
  };

  if (params.stage === "pra-observasi") {
    const [po, instrumen, konferensiList] = await Promise.all([
      prisma.praObservasi.findUnique({
        where: { siklusId: s.id },
        include: { indikator: true, konferensi: true },
      }),
      ambilInstrumen("pra"),
      ambilKonferensi(),
    ]);
    return NextResponse.json({
      ...base,
      tanggal: po?.tanggal ?? null,
      catatanUmum: po?.catatanUmum ?? "",
      selesai: po?.selesai ?? false,
      totalSkor: po?.totalSkor ?? 0,
      nilaiAkhir: po?.nilaiAkhir ?? 0,
      predikat: po?.predikat ?? null,
      indikator: (po?.indikator ?? []).map((i) => ({
        key: `${i.komponen}-${i.nomorIndikator}`,
        skor: i.skor,
        catatan: i.catatan ?? "",
      })),
      konferensi: (po?.konferensi ?? []).map((k) => ({
        nomor: k.nomorPertanyaan,
        jawaban: k.jawaban ?? "",
      })),
      instrumen,
      konferensiList,
      skorMaks: skorMaks(instrumen),
    });
  }

  if (params.stage === "observasi") {
    const [ok, instrumen] = await Promise.all([
      prisma.observasiKelas.findUnique({
        where: { siklusId: s.id },
        include: { indikator: true },
      }),
      ambilInstrumen("observasi"),
    ]);
    return NextResponse.json({
      ...base,
      tanggal: ok?.tanggal ?? null,
      catatanUmum: ok?.catatanUmum ?? "",
      selesai: ok?.selesai ?? false,
      totalSkor: ok?.totalSkor ?? 0,
      nilaiAkhir: ok?.nilaiAkhir ?? 0,
      predikat: ok?.predikat ?? null,
      indikator: (ok?.indikator ?? []).map((i) => ({
        key: `${i.komponen}-${i.nomorIndikator}`,
        skor: i.skor,
        catatan: i.catatan ?? "",
      })),
      instrumen,
      skorMaks: skorMaks(instrumen),
    });
  }

  if (params.stage === "pasca") {
    const [ps, instrumen] = await Promise.all([
      prisma.pascaSupervisi.findUnique({
        where: { siklusId: s.id },
        include: { indikator: true, rtl: true },
      }),
      ambilInstrumen("pasca"),
    ]);
    return NextResponse.json({
      ...base,
      tanggal: ps?.tanggal ?? null,
      catatanUmum: ps?.catatanUmum ?? "",
      selesai: ps?.selesai ?? false,
      totalSkor: ps?.totalSkor ?? 0,
      nilaiAkhir: ps?.nilaiAkhir ?? 0,
      predikat: ps?.predikat ?? null,
      indikator: (ps?.indikator ?? []).map((i) => ({
        key: `${i.komponen}-${i.nomorIndikator}`,
        skor: i.skor,
        catatan: i.catatan ?? "",
      })),
      rtl: ps?.rtl ?? [],
      instrumen,
      skorMaks: skorMaks(instrumen),
    });
  }

  return NextResponse.json({ error: "Tahapan tidak dikenal" }, { status: 404 });
}

// PUT /api/siklus/[id]/[stage] — simpan data tahapan
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR" && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const res = await authorizeSiklus(params.id, session.user.id, session.user?.role);
  if ("notFound" in res) return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  if ("forbidden" in res) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const cfg = stageConfig(params.stage);
  if (!cfg) return NextResponse.json({ error: "Tahapan tidak dikenal" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const selesai = body.selesai === true;
  const tanggal = typeof body.tanggal === "string" && body.tanggal !== "" ? new Date(body.tanggal) : null;
  const catatanUmum = typeof body.catatanUmum === "string" ? body.catatanUmum.trim() || null : null;
  const indikatorInput: { key: string; skor: number; catatan: string; deskripsi?: string; dimensi?: string }[] = Array.isArray(body.indikator)
    ? body.indikator
    : [];

  // Instrumen untuk melengkapi deskripsi/dimensi indikator otomatis (dari DB)
  const instrumen = await instrumenMap(params.stage);

  // Validasi & agregasi skor
  let totalSkor = 0;
  const rows = indikatorInput
    .filter((i) => typeof i.key === "string" && i.key.includes("-"))
    .map((i) => {
      const [komponen, nomorStr] = i.key.split("-");
      const skor = Math.max(0, Math.min(4, Math.round(Number(i.skor) || 0)));
      totalSkor += skor;
      const ref = instrumen.get(i.key);
      return {
        komponen: komponen.slice(0, 30),
        nomorIndikator: Math.max(1, Math.round(Number(nomorStr) || 0)),
        deskripsi: typeof i.deskripsi === "string" && i.deskripsi.trim() !== "" ? i.deskripsi.trim() : ref?.deskripsi ?? "",
        dimensi: typeof i.dimensi === "string" && i.dimensi.trim() !== "" ? i.dimensi.trim() : ref?.dimensi ?? "-",
        skor,
        catatan: typeof i.catatan === "string" ? i.catatan.trim() || null : null,
      };
    });

  const konferensiInput: { nomor: number; jawaban: string }[] = Array.isArray(body.konferensi)
    ? body.konferensi
    : [];

  try {
    // Simpan data stage + indikator dalam transaksi, dan naikkan status siklus jika selesai
    await prisma.$transaction(async (tx) => {
      const model: string = cfg.model;

      // Hitung nilai & predikat — skor maks DINAMIS dari instrumen DB
      let nilaiAkhir = 0;
      let predikat: "KURANG" | "CUKUP" | "BAIK" | "SANGAT_BAIK" | null = null;
      if (selesai) {
        const st = STAGE_API[params.stage];
        const komponenSt = st ? await ambilInstrumen(st) : [];
        const maksFinal = skorMaks(komponenSt);
        const hasil = hitungNilai(totalSkor, maksFinal);
        nilaiAkhir = hasil.nilaiAkhir;
        predikat = hasil.predikat;
      }

      if (model === "praObservasi") {
        const pra = await tx.praObservasi.upsert({
          where: { siklusId: params.id },
          update: { tanggal, totalSkor, nilaiAkhir, predikat, catatanUmum, selesai },
          create: { siklusId: params.id, tanggal, totalSkor, nilaiAkhir, predikat, catatanUmum, selesai },
        });
        await tx.praIndikator.deleteMany({ where: { praObservasiId: pra.id } });
        if (rows.length > 0) {
          await tx.praIndikator.createMany({
            data: rows.map((r) => ({
              praObservasiId: pra.id,
              komponen: r.komponen,
              nomorIndikator: r.nomorIndikator,
              deskripsi: r.deskripsi || "-",
              skor: r.skor,
              catatan: r.catatan,
            })),
          });
        }
        await tx.konferensiPra.deleteMany({ where: { praObservasiId: pra.id } });
        if (konferensiInput.length > 0) {
          await tx.konferensiPra.createMany({
            data: konferensiInput
              .filter((k) => Number(k.nomor) > 0)
              .map((k) => ({
                praObservasiId: pra.id,
                nomorPertanyaan: Math.round(Number(k.nomor)),
                pertanyaan: "Konferensi Pra-Observasi",
                jawaban: typeof k.jawaban === "string" ? k.jawaban : null,
              })),
          });
        }
      } else if (model === "observasiKelas") {
        const stObs = STAGE_API[params.stage];
        const komponenObs = stObs ? await ambilInstrumen(stObs) : [];
        const maksObs = skorMaks(komponenObs);
        const obs = await tx.observasiKelas.upsert({
          where: { siklusId: params.id },
          update: { tanggal, totalSkor, skorMaks: maksObs, nilaiAkhir, predikat, catatanUmum, selesai },
          create: { siklusId: params.id, tanggal, totalSkor, skorMaks: maksObs, nilaiAkhir, predikat, catatanUmum, selesai },
        });
        await tx.observasiIndikator.deleteMany({ where: { observasiKelasId: obs.id } });
        if (rows.length > 0) {
          await tx.observasiIndikator.createMany({
            data: rows.map((r) => ({
              observasiKelasId: obs.id,
              komponen: r.komponen,
              nomorIndikator: r.nomorIndikator,
              dimensi: r.dimensi ?? "-",
              deskripsi: r.deskripsi || "-",
              skor: r.skor,
              catatan: r.catatan,
            })),
          });
        }
      } else {
        const pasca = await tx.pascaSupervisi.upsert({
          where: { siklusId: params.id },
          update: { tanggal, totalSkor, nilaiAkhir, predikat, catatanUmum, selesai },
          create: { siklusId: params.id, tanggal, totalSkor, nilaiAkhir, predikat, catatanUmum, selesai },
        });
        await tx.pascaIndikator.deleteMany({ where: { pascaSupervisiId: pasca.id } });
        if (rows.length > 0) {
          await tx.pascaIndikator.createMany({
            data: rows.map((r) => ({
              pascaSupervisiId: pasca.id,
              komponen: r.komponen,
              nomorIndikator: r.nomorIndikator,
              deskripsi: r.deskripsi || "-",
              skor: r.skor,
              catatan: r.catatan,
            })),
          });
        }
        // RTL: replace semua
        if (Array.isArray(body.rtl)) {
          await tx.rencanaTindakLanjut.deleteMany({ where: { pascaSupervisiId: pasca.id } });
          const rtlRows = (body.rtl as Record<string, unknown>[])
            .filter((r) => typeof r.aspek === "string" && r.aspek.trim() !== "")
            .map((r) => ({
              pascaSupervisiId: pasca.id,
              aspek: String(r.aspek).trim().slice(0, 255),
              temuan: typeof r.temuan === "string" && r.temuan.trim() !== "" ? r.temuan.trim() : "-",
              rencana: typeof r.rencana === "string" && r.rencana.trim() !== "" ? r.rencana.trim() : "-",
              target: typeof r.target === "string" && r.target.trim() !== "" ? r.target.trim() : null,
              deadline: typeof r.deadline === "string" && r.deadline !== "" ? new Date(r.deadline) : null,
              statusMonitoring:
                r.statusMonitoring === "SELESAI" || r.statusMonitoring === "PROSES" ? r.statusMonitoring : "BELUM",
            }));
          if (rtlRows.length > 0) await tx.rencanaTindakLanjut.createMany({ data: rtlRows });
        }
      }

      // Update status siklus
      const current = await tx.siklus.findUnique({ where: { id: params.id }, select: { status: true } });
      if (current) {
        const urutan = ["DRAFT", "PRA_OBSERVASI", "OBSERVASI", "PASCA_SUPERVISI", "SELESAI"];
        const target = selesai ? cfg.doneStatus : cfg.nextStatus;
        const currentIdx = urutan.indexOf(current.status);
        const targetIdx = urutan.indexOf(target);
        // Status siklus hanya bergerak maju
        if (targetIdx > currentIdx) {
          const extra = selesai && params.stage === "pasca" ? { tanggalSelesai: new Date() } : {};
          await tx.siklus.update({ where: { id: params.id }, data: { status: target, ...extra } });
        }
      }
    });

    // Notifikasi ke guru saat tahapan ditandai selesai
    if (selesai) {
      const labelTahap =
        params.stage === "pra-observasi" ? "Pra Observasi" : params.stage === "observasi" ? "Observasi Kelas" : "Pasca Supervisi";
      await kirimNotifikasi({
        userId: res.siklus.guru.id,
        judul: `${labelTahap} Selesai`,
        pesan: `Tahap ${labelTahap} untuk siklus supervisi Anda telah diselesaikan oleh ${session.user.name}.`,
        tipe: "supervisi",
        link: "/guru/hasil",
      });
    }

    return NextResponse.json({ success: true, totalSkor, selesai });
  } catch (e) {
    console.error("Gagal menyimpan tahapan:", e);
    return NextResponse.json({ error: "Gagal menyimpan tahapan" }, { status: 500 });
  }
}
