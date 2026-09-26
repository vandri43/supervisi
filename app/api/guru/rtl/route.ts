import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { kirimKePengawas } from "@/lib/notifikasi";

// GET /api/guru/rtl — semua RTL dari siklus guru yang login (tahun ajaran aktif; ?all=1 semua)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const showAll = req.nextUrl.searchParams.get("all") === "1";
  const tahunFilter: Record<string, string> = showAll
    ? {}
    : await getSettings().then((s) => ({ tahunAjaran: s.tahunAjaran, semester: s.semester }));

  // Guru hanya melihat RTL siklusnya sendiri; ADMIN/SUPERVISOR melihat RTL semua guru
  const isPengawas = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";
  const siklus = await prisma.siklus.findMany({
    where: { ...(isPengawas ? {} : { guruId: session.user.id }), ...tahunFilter },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tahunAjaran: true,
      semester: true,
      topikPembelajaran: true,
      guru: { select: { nama: true } },
      pascaSupervisi: {
        select: {
          rtl: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  const data = siklus.flatMap((s) =>
    s.pascaSupervisi?.rtl.map((r) => ({
      id: r.id,
      siklusId: s.id,
      namaGuru: s.guru.nama,
      topikSiklus: s.topikPembelajaran ?? "(tanpa topik)",
      tahunAjaran: s.tahunAjaran,
      semester: s.semester,
      aspek: r.aspek,
      temuan: r.temuan,
      rencana: r.rencana,
      target: r.target,
      deadline: r.deadline,
      status: r.statusMonitoring,
      hasilMonitoring: r.hasilMonitoring,
    })) ?? []
  );

  return NextResponse.json(data);
}

// PUT /api/guru/rtl — guru menyimpan catatan progres RTL miliknya
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const hasilMonitoring = typeof body?.hasilMonitoring === "string" ? body.hasilMonitoring.trim() : null;
  const status = ["BELUM", "PROSES", "SELESAI"].includes(body?.status) ? body.status : null;

  if (!id) {
    return NextResponse.json({ error: "ID RTL tidak valid" }, { status: 400 });
  }

  // Pastikan RTL ini milik siklus guru yang login
  const rtl = await prisma.rencanaTindakLanjut.findUnique({
    where: { id },
    include: { pascaSupervisi: { select: { siklus: { select: { guruId: true } } } } },
  });
  if (!rtl) {
    return NextResponse.json({ error: "RTL tidak ditemukan" }, { status: 404 });
  }
  if (rtl.pascaSupervisi.siklus.guruId !== session.user.id) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  await prisma.rencanaTindakLanjut.update({
    where: { id },
    data: {
      ...(hasilMonitoring !== null ? { hasilMonitoring } : {}),
      ...(status !== null ? { statusMonitoring: status } : {}),
    },
  });

  // Beri tahu supervisor siklus bahwa guru mengisi progres RTL
  if (hasilMonitoring !== null) {
    const siklusInfo = await prisma.rencanaTindakLanjut.findUnique({
      where: { id },
      select: {
        aspek: true,
        pascaSupervisi: {
          select: { siklusId: true, siklus: { select: { topikPembelajaran: true } } },
        },
      },
    });
    if (siklusInfo) {
      await kirimKePengawas({
        judul: "Progres RTL Diperbarui",
        pesan: `${session.user.name} mengisi progres RTL "${siklusInfo.aspek}"${siklusInfo.pascaSupervisi.siklus.topikPembelajaran ? ` (topik: ${siklusInfo.pascaSupervisi.siklus.topikPembelajaran})` : ""}.`,
        tipe: "rtl",
        link: `/supervisor/pasca/${siklusInfo.pascaSupervisi.siklusId}`,
      });
    }
  }

  return NextResponse.json({ success: true });
}
