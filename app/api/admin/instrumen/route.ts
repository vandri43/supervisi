import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isStage, ambilInstrumen, ambilKonferensi, resetCacheInstrumen, skorMaks, LABEL_STAGE,
} from "@/lib/instrumen-db";

export const dynamic = "force-dynamic";

const onlyAdmin = (role?: string) => role === "ADMIN";

// GET /api/admin/instrumen?stage=pra — struktur instrumen + pertanyaan konferensi
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Hanya ADMIN yang boleh mengelola instrumen" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const stageParam = sp.get("stage");

  // ?stage=xxx → detail satu tahap (untuk pemakaian internal/editor)
  if (stageParam && isStage(stageParam)) {
    const komponen = await ambilInstrumen(stageParam, true);
    return NextResponse.json({ stage: stageParam, label: LABEL_STAGE[stageParam], komponen, skorMaks: skorMaks(komponen) });
  }

  // konferensiDetail=1 → baris konferensi dengan id asli (untuk edit/hapus di UI admin)
  if (sp.get("konferensiDetail") === "1") {
    const rows = await prisma.instrumenKonferensi.findMany({ orderBy: { urutan: "asc" } });
    return NextResponse.json({ konferensi: rows.map((r) => ({ id: r.id, pertanyaan: r.pertanyaan })) });
  }

  // Tanpa stage spesifik: ringkasan ketiga stage + daftar pertanyaan konferensi
  const [pra, observasi, pasca] = await Promise.all([
    ambilInstrumen("pra", true),
    ambilInstrumen("observasi", true),
    ambilInstrumen("pasca", true),
  ]);

  const konferensi = await ambilKonferensi();
  return NextResponse.json({
    stages: [
      { stage: "pra", label: LABEL_STAGE.pra, komponen: pra, skorMaks: skorMaks(pra) },
      { stage: "observasi", label: LABEL_STAGE.observasi, komponen: observasi, skorMaks: skorMaks(observasi) },
      { stage: "pasca", label: LABEL_STAGE.pasca, komponen: pasca, skorMaks: skorMaks(pasca) },
    ],
    konferensi,
  });
}

// POST — tambah komponen / indikator / pertanyaan konferensi
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Hanya ADMIN yang boleh mengelola instrumen" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  try {
    // --- Tambah pertanyaan konferensi
    if (body.tipe === "konferensi") {
      const pertanyaan = typeof body.pertanyaan === "string" ? body.pertanyaan.trim() : "";
      if (!pertanyaan) return NextResponse.json({ error: "Pertanyaan wajib diisi" }, { status: 400 });
      const jumlah = await prisma.instrumenKonferensi.count();
      await prisma.instrumenKonferensi.create({ data: { pertanyaan, urutan: jumlah } });
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // --- Tambah komponen baru
    if (body.tipe === "komponen") {
      const stage = body.stage;
      if (!isStage(stage)) return NextResponse.json({ error: "Stage tidak dikenal" }, { status: 400 });
      const kode = typeof body.kode === "string" ? body.kode.trim().toUpperCase().slice(0, 10) : "";
      const judul = typeof body.judul === "string" ? body.judul.trim() : "";
      if (!kode || !judul) return NextResponse.json({ error: "Kode dan judul komponen wajib diisi" }, { status: 400 });
      const ada = await prisma.instrumenKomponen.findUnique({ where: { stage_kode: { stage, kode } } });
      if (ada) return NextResponse.json({ error: `Komponen "${kode}" sudah ada di stage ini` }, { status: 400 });
      const jumlah = await prisma.instrumenKomponen.count({ where: { stage } });
      await prisma.instrumenKomponen.create({ data: { stage, kode, judul, urutan: jumlah } });
      resetCacheInstrumen();
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // --- Tambah indikator ke komponen
    if (body.tipe === "indikator") {
      const komponenId = typeof body.komponenId === "string" ? body.komponenId : "";
      const deskripsi = typeof body.deskripsi === "string" ? body.deskripsi.trim() : "";
      const dimensi = typeof body.dimensi === "string" && body.dimensi ? body.dimensi.trim() : null;
      const tagPM = typeof body.tagPM === "string" && body.tagPM ? body.tagPM.trim() : null;
      if (!komponenId || !deskripsi) return NextResponse.json({ error: "Komponen dan deskripsi indikator wajib diisi" }, { status: 400 });
      const jumlah = await prisma.instrumenIndikator.count({ where: { komponenId } });
      const nomor = jumlah + 1; // nomor otomatis urut
      await prisma.instrumenIndikator.create({
        data: { komponenId, nomor, deskripsi, dimensi, tagPM, urutan: jumlah },
      });
      resetCacheInstrumen();
      return NextResponse.json({ success: true, nomor }, { status: 201 });
    }

    return NextResponse.json({ error: "Tipe tidak dikenal" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan data instrumen" }, { status: 500 });
  }
}

// PUT — edit judul komponen / deskripsi indikator / pertanyaan konferensi / geser urutan
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Hanya ADMIN yang boleh mengelola instrumen" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  try {
    // --- Edit pertanyaan konferensi
    if (body.tipe === "konferensi") {
      const id = typeof body.id === "string" ? body.id : "";
      const pertanyaan = typeof body.pertanyaan === "string" ? body.pertanyaan.trim() : "";
      if (!id || !pertanyaan) return NextResponse.json({ error: "ID dan pertanyaan wajib diisi" }, { status: 400 });
      await prisma.instrumenKonferensi.update({ where: { id }, data: { pertanyaan } });
      return NextResponse.json({ success: true });
    }

    // --- Geser urutan komponen (naik/turun)
    if (body.tipe === "geser") {
      const id = typeof body.id === "string" ? body.id : "";
      const arah = body.arah === "atas" || body.arah === "bawah" ? body.arah : null;
      if (!id || !arah) return NextResponse.json({ error: "ID dan arah wajib diisi" }, { status: 400 });
      const komp = await prisma.instrumenKomponen.findUnique({ where: { id } });
      if (!komp) return NextResponse.json({ error: "Komponen tidak ditemukan" }, { status: 404 });
      const semua = await prisma.instrumenKomponen.findMany({
        where: { stage: komp.stage },
        orderBy: [{ urutan: "asc" }, { kode: "asc" }],
      });
      const idx = semua.findIndex((x) => x.id === id);
      const tukarDengan = arah === "atas" ? semua[idx - 1] : semua[idx + 1];
      if (!tukarDengan) return NextResponse.json({ success: true }); // sudah di ujung
      await prisma.$transaction([
        prisma.instrumenKomponen.update({ where: { id: komp.id }, data: { urutan: tukarDengan.urutan } }),
        prisma.instrumenKomponen.update({ where: { id: tukarDengan.id }, data: { urutan: komp.urutan } }),
      ]);
      resetCacheInstrumen();
      return NextResponse.json({ success: true });
    }

    // --- Edit komponen
    if (body.tipe === "komponen") {
      const id = typeof body.id === "string" ? body.id : "";
      const judul = typeof body.judul === "string" ? body.judul.trim() : "";
      if (!id || !judul) return NextResponse.json({ error: "ID dan judul wajib diisi" }, { status: 400 });
      await prisma.instrumenKomponen.update({ where: { id }, data: { judul } });
      resetCacheInstrumen();
      return NextResponse.json({ success: true });
    }

    // --- Edit indikator
    if (body.tipe === "indikator") {
      const id = typeof body.id === "string" ? body.id : "";
      const deskripsi = typeof body.deskripsi === "string" ? body.deskripsi.trim() : "";
      const dimensi = typeof body.dimensi === "string" && body.dimensi ? body.dimensi.trim() : null;
      const tagPM = typeof body.tagPM === "string" && body.tagPM ? body.tagPM.trim() : null;
      if (!id || !deskripsi) return NextResponse.json({ error: "ID dan deskripsi wajib diisi" }, { status: 400 });
      await prisma.instrumenIndikator.update({ where: { id }, data: { deskripsi, dimensi, tagPM } });
      resetCacheInstrumen();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tipe tidak dikenal" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan perubahan" }, { status: 500 });
  }
}

// DELETE — hapus indikator / komponen (beserta indikatornya) / pertanyaan konferensi
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Hanya ADMIN yang boleh mengelola instrumen" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const tipe = sp.get("tipe") ?? "";
  const id = sp.get("id") ?? "";
  if (!tipe || !id) return NextResponse.json({ error: "tipe dan id wajib diisi" }, { status: 400 });

  try {
    if (tipe === "indikator") {
      await prisma.instrumenIndikator.delete({ where: { id } });
    } else if (tipe === "komponen") {
      await prisma.instrumenKomponen.delete({ where: { id } });
    } else if (tipe === "konferensi") {
      await prisma.instrumenKonferensi.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Tipe tidak dikenal" }, { status: 400 });
    }
    resetCacheInstrumen();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus (data mungkin sudah tidak ada)" }, { status: 500 });
  }
}
