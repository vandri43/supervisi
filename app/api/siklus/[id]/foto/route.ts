import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kirimNotifikasi, kirimKePengawas } from "@/lib/notifikasi";
import {
  mimeDiizinkan,
  mimeVideoDiizinkan,
  isVideo,
  simpanFoto,
  FOTO_MAX_UKURAN,
  VIDEO_MAX_UKURAN,
} from "@/lib/foto";

// GET /api/siklus/[id]/foto — daftar foto dokumentasi siklus
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const siklus = await prisma.siklus.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!siklus) {
    return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  }

  const foto = await prisma.fotoSupervisi.findMany({
    where: { siklusId: params.id },
    orderBy: { createdAt: "desc" },
    include: { uploader: { select: { nama: true } } },
  });

  return NextResponse.json(
    foto.map((f) => ({
      id: f.id,
      url: `/api/foto/${f.id}`,
      keterangan: f.keterangan,
      fileName: f.fileName,
      ukuran: f.ukuran,
      uploader: f.uploader.nama,
      createdAt: f.createdAt,
    }))
  );
}

// POST /api/siklus/[id]/foto — upload foto dokumentasi (multipart/form-data, field "file")
// Supervisor/admin mengunggah bukti otentik pelaksanaan supervisi.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  const siklus = await prisma.siklus.findUnique({
    where: { id: params.id },
    select: { id: true, guruId: true, topikPembelajaran: true },
  });
  if (!siklus) {
    return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  }

  // Supervisor/admin boleh upload dokumentasi; GURU pemilik siklus juga boleh
  // mengunggah foto/video kegiatannya sebagai bukti.
  const isPengawas = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";
  if (!isPengawas && session.user.id !== siklus.guruId) {
    return NextResponse.json({ error: "Hanya supervisor/admin atau guru pemilik siklus yang bisa mengunggah" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Data unggahan tidak valid" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File foto wajib diunggah (field: file)" }, { status: 400 });
  }
  const keterangan = typeof formData.get("keterangan") === "string" ? (formData.get("keterangan") as string).trim() : "";

  if (file.size === 0) {
    return NextResponse.json({ error: "File kosong" }, { status: 400 });
  }

  const mime = file.type || "image/jpeg";
  const video = isVideo(mime);

  if (video) {
    if (!mimeVideoDiizinkan(mime)) {
      return NextResponse.json({ error: "Format video harus MP4, WEBM, atau MOV" }, { status: 400 });
    }
    if (file.size > VIDEO_MAX_UKURAN) {
      return NextResponse.json({ error: "Ukuran video maksimal 50 MB" }, { status: 400 });
    }
  } else {
    if (!mimeDiizinkan(mime)) {
      return NextResponse.json({ error: "Format harus JPG, PNG, WEBP, atau HEIC" }, { status: 400 });
    }
    if (file.size > FOTO_MAX_UKURAN) {
      return NextResponse.json({ error: "Ukuran foto maksimal 2 MB (otomatis dikompres aplikasi menjadi di bawah 1 MB)" }, { status: 400 });
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storedName = await simpanFoto(buffer, mime);

  const foto = await prisma.fotoSupervisi.create({
    data: {
      siklusId: params.id,
      uploaderId: session.user.id,
      fileName: file.name.slice(0, 255),
      storedName,
      mimeType: mime,
      ukuran: file.size,
      keterangan: keterangan || null,
    },
  });

  // Upload oleh GURU juga dicatat sebagai Bukti tugas (perlu verifikasi pengawas);
  // setelah DITERIMA, media ini tampil di galeri publik halaman depan.
  if (!isPengawas) {
    await prisma.bukti.create({
      data: {
        siklusId: params.id,
        guruId: session.user.id,
        judul: file.name.slice(0, 200),
        jenis: video ? "VIDEO_PEMBELAJARAN" : "FOTO_KEGIATAN",
        link: `/api/foto/${foto.id}`,
      },
    });
  }

  // Notifikasi: guru upload → beri tahu pengawas; pengawas upload → beri tahu guru
  if (isPengawas) {
    await kirimNotifikasi({
      userId: siklus.guruId,
      judul: video ? "Dokumentasi Video Supervisi" : "Dokumentasi Foto Supervisi",
      pesan: `Supervisor mengunggah ${video ? "video" : "foto"} "${file.name.slice(0, 60)}" sebagai dokumentasi${siklus.topikPembelajaran ? ` supervisi "${siklus.topikPembelajaran}"` : ""}.`,
      tipe: "supervisi",
      link: "/guru/hasil",
    });
  } else {
    await kirimKePengawas({
      judul: video ? "Bukti Video Baru" : "Bukti Foto Baru",
      pesan: `${session.user.name} mengunggah ${video ? "video" : "foto"} "${file.name.slice(0, 60)}"${siklus.topikPembelajaran ? ` pada topik "${siklus.topikPembelajaran}"` : ""}.`,
      tipe: "supervisi",
      link: `/supervisor/siklus/${params.id}`,
    });
  }

  return NextResponse.json(
    {
      success: true,
      id: foto.id,
      url: `/api/foto/${foto.id}`,
      fileName: foto.fileName,
    },
    { status: 201 }
  );
}
