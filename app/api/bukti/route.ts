import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { kirimNotifikasi, kirimKePengawas } from "@/lib/notifikasi";

// Jenis bukti yang valid (route file hanya boleh export handler HTTP)
const JENIS_BUKTI = ["RPP_RPM", "ANALISIS_CP", "RPE", "MODUL_AJAR", "VIDEO_PEMBELAJARAN", "FOTO_KEGIATAN", "LAINNYA"] as const;

const LABEL_JENIS: Record<string, string> = {
  RPP_RPM: "RPP/RPM",
  ANALISIS_CP: "Analisis CP/Silabus",
  RPE: "Rencana Pekan Efektif",
  MODUL_AJAR: "Modul Ajar",
  VIDEO_PEMBELAJARAN: "Video Pembelajaran",
  FOTO_KEGIATAN: "Foto Kegiatan",
  LAINNYA: "Lainnya",
};

const isPengawas = (role: string) => role === "ADMIN" || role === "SUPERVISOR";

// GET /api/bukti?siklusId=xxx — daftar bukti.
// GURU: bukti miliknya sendiri (opsional filter siklus). ADMIN/SUPERVISOR: wajib siklusId.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const siklusId = req.nextUrl.searchParams.get("siklusId");

  if (isPengawas(session.user.role)) {
    if (!siklusId) {
      return NextResponse.json({ error: "Parameter siklusId wajib diisi" }, { status: 400 });
    }
  }

  // Filter tahun ajaran aktif untuk tampilan default guru (konsisten dengan menu lain)
  const showAll = req.nextUrl.searchParams.get("all") === "1";
  const settings = showAll ? null : await getSettings();

  const bukti = await prisma.bukti.findMany({
    where: {
      ...(siklusId ? { siklusId } : {}),
      ...(isPengawas(session.user.role) ? {} : { guruId: session.user.id }),
      ...(settings && !siklusId
        ? { siklus: { tahunAjaran: settings.tahunAjaran, semester: settings.semester as "GANJIL" | "GENAP" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      siklus: {
        select: {
          id: true,
          topikPembelajaran: true,
          tahunAjaran: true,
          semester: true,
          status: true,
          guru: { select: { nama: true } },
        },
      },
      diverifikasiOleh: { select: { nama: true } },
    },
  });

  return NextResponse.json(
    bukti.map((b) => ({
      id: b.id,
      siklusId: b.siklusId,
      topikSiklus: b.siklus.topikPembelajaran,
      statusSiklus: b.siklus.status,
      tahunAjaran: b.siklus.tahunAjaran,
      semester: b.siklus.semester,
      namaGuru: b.siklus.guru.nama,
      judul: b.judul,
      jenis: b.jenis,
      jenisLabel: LABEL_JENIS[b.jenis] ?? b.jenis,
      link: b.link,
      keterangan: b.keterangan,
      status: b.status,
      catatanVerifikasi: b.catatanVerifikasi,
      verifikator: b.diverifikasiOleh?.nama ?? null,
      diverifikasiPada: b.diverifikasiPada,
      createdAt: b.createdAt,
    }))
  );
}

// POST /api/bukti — guru menambah bukti link pada siklus miliknya
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const siklusId = typeof body?.siklusId === "string" ? body.siklusId : "";
  const judul = typeof body?.judul === "string" ? body.judul.trim() : "";
  const jenis = JENIS_BUKTI.includes(body?.jenis) ? body.jenis : "LAINNYA";
  const link = typeof body?.link === "string" ? body.link.trim() : "";
  const keterangan = typeof body?.keterangan === "string" ? body.keterangan.trim() : "";

  if (!siklusId || !judul || !link) {
    return NextResponse.json({ error: "Siklus, judul, dan link wajib diisi" }, { status: 400 });
  }

  // Validasi URL (http/https saja)
  let parsed: URL;
  try {
    parsed = new URL(link);
  } catch {
    return NextResponse.json({ error: "Link tidak valid. Contoh: https://drive.google.com/..." }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Link harus dimulai dengan http:// atau https://" }, { status: 400 });
  }

  // Pastikan siklus ada dan milik guru yang login (pengawas tidak menambah bukti)
  const siklus = await prisma.siklus.findUnique({ where: { id: siklusId }, select: { guruId: true, topikPembelajaran: true } });
  if (!siklus) {
    return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  }
  if (siklus.guruId !== session.user.id) {
    return NextResponse.json({ error: "Anda hanya bisa menambah bukti pada siklus Anda sendiri" }, { status: 403 });
  }

  const bukti = await prisma.bukti.create({
    data: { siklusId, guruId: session.user.id, judul, jenis, link, keterangan: keterangan || null },
  });

  // Beri tahu pengawas bahwa guru mengumpulkan bukti tugas
  await kirimKePengawas({
    judul: "Bukti Tugas Baru",
    pesan: `${session.user.name} mengumpulkan bukti "${judul}" (${LABEL_JENIS[jenis]})${siklus.topikPembelajaran ? ` pada topik "${siklus.topikPembelajaran}"` : ""}.`,
    tipe: "supervisi",
    link: `/supervisor/siklus/${siklusId}`,
  });

  return NextResponse.json({ success: true, id: bukti.id }, { status: 201 });
}

// PUT /api/bukti — guru mengedit bukti miliknya / pengawas memverifikasi
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "ID bukti tidak valid" }, { status: 400 });
  }

  const bukti = await prisma.bukti.findUnique({
    where: { id },
    include: { siklus: { select: { id: true, guruId: true, topikPembelajaran: true } } },
  });
  if (!bukti) {
    return NextResponse.json({ error: "Bukti tidak ditemukan" }, { status: 404 });
  }

  // --- Verifikasi oleh pengawas
  if (body?.aksi === "verifikasi") {
    if (!isPengawas(session.user.role)) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }
    const keputusan =
      body.keputusan === "DITERIMA" || body.keputusan === "DITOLAK" || body.keputusan === "MENUNGGU"
        ? body.keputusan
        : null;
    if (!keputusan) {
      return NextResponse.json({ error: "Keputusan verifikasi tidak valid" }, { status: 400 });
    }
    const catatan = typeof body?.catatan === "string" ? body.catatan.trim() : "";

    // MENUNGGU = pembatalan verifikasi oleh pengawas
    await prisma.bukti.update({
      where: { id },
      data:
        keputusan === "MENUNGGU"
          ? { status: "MENUNGGU" as const, catatanVerifikasi: null, diverifikasiOlehId: null, diverifikasiPada: null }
          : {
              status: keputusan,
              catatanVerifikasi: catatan || null,
              diverifikasiOlehId: session.user.id,
              diverifikasiPada: new Date(),
            },
    });

    if (keputusan !== "MENUNGGU") {
      await kirimNotifikasi({
        userId: bukti.guruId,
        judul: keputusan === "DITERIMA" ? "Bukti Diterima" : "Bukti Perlu Perbaikan",
        pesan:
          `Bukti "${bukti.judul}" ${keputusan === "DITERIMA" ? "telah diterima" : "ditolak untuk diperbaiki"}` +
          (catatan ? ` — Catatan: ${catatan}` : "."),
        tipe: keputusan === "DITERIMA" ? "sukses" : "info",
        link: "/guru/bukti",
      });
    }

    return NextResponse.json({ success: true });
  }

  // --- Edit oleh guru pemilik
  if (bukti.siklus.guruId !== session.user.id) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const judul = typeof body?.judul === "string" ? body.judul.trim() : "";
  const link = typeof body?.link === "string" ? body.link.trim() : "";
  const keterangan = typeof body?.keterangan === "string" ? body.keterangan.trim() : null;
  const jenis = JENIS_BUKTI.includes(body?.jenis) ? body.jenis : null;

  if (!judul || !link) {
    return NextResponse.json({ error: "Judul dan link wajib diisi" }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(link);
  } catch {
    return NextResponse.json({ error: "Link tidak valid" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Link harus dimulai dengan http:// atau https://" }, { status: 400 });
  }

  await prisma.bukti.update({
    where: { id },
    data: {
      judul,
      link,
      ...(keterangan !== null ? { keterangan: keterangan || null } : {}),
      ...(jenis ? { jenis } : {}),
      // Bukti yang diedit setelah ditolak kembali menunggu verifikasi
      ...(bukti.status === "DITOLAK" ? { status: "MENUNGGU" as const, catatanVerifikasi: null, diverifikasiOlehId: null, diverifikasiPada: null } : {}),
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/bukti?id=xxx — guru menghapus bukti miliknya (pengawas juga boleh)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "ID bukti tidak valid" }, { status: 400 });
  }

  const bukti = await prisma.bukti.findUnique({
    where: { id },
    include: { siklus: { select: { guruId: true } } },
  });
  if (!bukti) {
    return NextResponse.json({ error: "Bukti tidak ditemukan" }, { status: 404 });
  }

  const isOwner = bukti.siklus.guruId === session.user.id;
  if (!isOwner && !isPengawas(session.user.role)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  await prisma.bukti.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
