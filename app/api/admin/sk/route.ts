import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  mimeSkDiizinkan,
  isPdf,
  simpanSk,
  hapusSkFile,
  SK_MAX_UKURAN,
} from "@/lib/foto";

export const dynamic = "force-dynamic";

const onlyAdmin = (role?: string) => role === "ADMIN";

// GET /api/admin/sk — daftar dokumen SK yang telah diunggah
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Hanya ADMIN yang boleh mengelola dokumen SK" }, { status: 403 });
  }

  const sk = await prisma.dokumenSk.findMany({
    orderBy: [{ createdAt: "asc" }],
    include: { uploader: { select: { nama: true } } },
  });

  return NextResponse.json(
    sk.map((d) => ({
      id: d.id,
      judul: d.judul,
      url: `/api/public/sk/${d.id}`,
      tipe: isPdf(d.mimeType) ? "pdf" : "gambar",
      fileName: d.fileName,
      mimeType: d.mimeType,
      ukuran: d.ukuran,
      keterangan: d.keterangan,
      uploader: d.uploader.nama,
      createdAt: d.createdAt,
    }))
  );
}

// POST /api/admin/sk — upload dokumen SK (multipart/form-data)
// field: "file" (wajib, bisa lebih dari satu), "judul" (opsional), "keterangan" (opsional)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Hanya ADMIN yang boleh mengunggah dokumen SK" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Data unggahan tidak valid" }, { status: 400 });
  }

  const files = formData.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "File wajib diunggah (field: file)" }, { status: 400 });
  }

  const judulUmum = typeof formData.get("judul") === "string" ? (formData.get("judul") as string).trim() : "";
  const keterangan = typeof formData.get("keterangan") === "string" ? (formData.get("keterangan") as string).trim() : "";

  const hasil: { id: string; judul: string; url: string; tipe: string; fileName: string }[] = [];
  const gagal: { fileName: string; alasan: string }[] = [];

  for (const file of files) {
    if (file.size === 0) {
      gagal.push({ fileName: file.name, alasan: "File kosong" });
      continue;
    }
    const mime = file.type || "application/pdf";
    if (!mimeSkDiizinkan(mime)) {
      gagal.push({ fileName: file.name, alasan: "Format harus PDF, JPG, PNG, atau WEBP" });
      continue;
    }
    if (file.size > SK_MAX_UKURAN) {
      gagal.push({ fileName: file.name, alasan: "Ukuran maksimal 10 MB" });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedName = await simpanSk(buffer, mime);

    // Judul per file: pakai nama file tanpa ekstensi bila judul umum kosong
    const namaTanpaExt = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    const judul = (judulUmum || namaTanpaExt || "Dokumen SK").slice(0, 200);

    const dok = await prisma.dokumenSk.create({
      data: {
        judul,
        fileName: file.name.slice(0, 255),
        storedName,
        mimeType: mime,
        ukuran: file.size,
        keterangan: keterangan || null,
        uploaderId: session.user.id,
      },
    });

    hasil.push({
      id: dok.id,
      judul: dok.judul,
      url: `/api/public/sk/${dok.id}`,
      tipe: isPdf(dok.mimeType) ? "pdf" : "gambar",
      fileName: dok.fileName,
    });
  }

  if (hasil.length === 0) {
    return NextResponse.json(
      { error: gagal[0]?.alasan ?? "Tidak ada file yang valid", gagal },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      jumlah: hasil.length,
      hasil,
      gagal: gagal.length > 0 ? gagal : undefined,
    },
    { status: 201 }
  );
}

// DELETE /api/admin/sk?id=xxx — hapus dokumen SK (record + file fisik)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Hanya ADMIN yang boleh menghapus dokumen SK" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Parameter id wajib diisi" }, { status: 400 });
  }

  const dok = await prisma.dokumenSk.findUnique({ where: { id } });
  if (!dok) {
    return NextResponse.json({ error: "Dokumen SK tidak ditemukan" }, { status: 404 });
  }

  await prisma.dokumenSk.delete({ where: { id } });
  await hapusSkFile(dok.storedName);

  return NextResponse.json({ success: true });
}
