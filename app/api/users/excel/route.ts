import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SHEET = "Pengguna";
const HEADERS = ["Nama Lengkap", "Email", "Password", "Role", "NIP", "Jabatan", "Mata Pelajaran", "Sekolah (NPSN)", "Status"];

const ROLE_NOTE = "Role harus salah satu dari: ADMIN, SUPERVISOR, GURU. Status: AKTIF atau NONAKTIF. Kosongkan Password saat edit (password tidak diubah). Untuk pengguna baru, password minimal 8 karakter (jika kosong, default: supervisi123). Sekolah diisi dengan NPSN yang sudah terdaftar di menu Kelola Sekolah.";

// GET /api/users/excel?mode=template|export (hanya ADMIN)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const mode = req.nextUrl.searchParams.get("mode") === "template" ? "template" : "export";
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistem Supervisi Guru";
  const ws = wb.addWorksheet(SHEET);

  ws.columns = [
    { header: HEADERS[0], key: "nama", width: 32 },
    { header: HEADERS[1], key: "email", width: 30 },
    { header: HEADERS[2], key: "password", width: 22 },
    { header: HEADERS[3], key: "role", width: 14 },
    { header: HEADERS[4], key: "nip", width: 24 },
    { header: HEADERS[5], key: "jabatan", width: 24 },
    { header: HEADERS[6], key: "mapel", width: 20 },
    { header: HEADERS[7], key: "npsn", width: 16 },
    { header: HEADERS[8], key: "status", width: 12 },
  ];

  // Styling header
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.height = 22;
  headerRow.alignment = { vertical: "middle" };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5E72E4" } };
    cell.border = { bottom: { style: "thin" } };
  });

  if (mode === "template") {
    // Baris contoh (dibiarkan di template sebagai panduan, boleh dihapus)
    ws.addRow({
      nama: "Contoh: Siti Rahayu, S.Pd",
      email: "contoh@sekolah.sch.id",
      password: "minimal8karakter",
      role: "GURU",
      nip: "198501012010012001",
      jabatan: "Guru Mata Pelajaran",
      mapel: "DKV",
      npsn: "12345678",
      status: "AKTIF",
    });
    ws.getRow(2).font = { italic: true, color: { argb: "FF999999" } };

    // Catatan panduan
    const noteRow = ws.addRow({ nama: `PETUNJUK: ${ROLE_NOTE}` });
    noteRow.font = { italic: true, color: { argb: "FF999999" }, size: 10 };
    noteRow.alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(`A${noteRow.number}:I${noteRow.number}`);
    ws.getRow(noteRow.number).height = 45;
  } else {
    // Export data nyata
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { nama: "asc" }],
      include: { sekolah: { select: { npsn: true, nama: true } } },
    });
    for (const u of users) {
      ws.addRow({
        nama: u.nama,
        email: u.email,
        password: "", // tidak pernah mengekspor password
        role: u.role,
        nip: u.nip ?? "",
        jabatan: u.jabatan ?? "",
        mapel: u.mapel ?? "",
        npsn: u.sekolah?.npsn ?? "",
        status: u.aktif ? "AKTIF" : "NONAKTIF",
      });
    }
  }

  // Freeze header + autofilter
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: HEADERS.length } };

  const fileName = mode === "template" ? "template-import-pengguna.xlsx" : "data-pengguna.xlsx";
  const buf = await wb.xlsx.writeBuffer();

  return new NextResponse(buf as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// POST /api/users/excel — import dari file Excel (hanya ADMIN)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File Excel tidak ditemukan" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 400 });
  }

  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "File tidak bisa dibaca. Pastikan format .xlsx" }, { status: 400 });
  }

  const ws = wb.getWorksheet(SHEET) || wb.worksheets[0];
  if (!ws) {
    return NextResponse.json({ error: "Sheet data tidak ditemukan di file" }, { status: 400 });
  }

  // Baca semua sekolah untuk mapping NPSN -> id
  const sekolahList = await prisma.sekolah.findMany({ select: { id: true, npsn: true, nama: true } });
  const byNpsn = new Map(sekolahList.filter((s) => s.npsn).map((s) => [s.npsn as string, s]));

  const results = { created: 0, updated: 0, failed: 0 };
  const errors: string[] = [];

  const getStr = (v: ExcelJS.CellValue): string =>
    v === null || v === undefined ? "" : String(v).trim();

  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const nama = getStr(row.getCell(1).value);
    const email = getStr(row.getCell(2).value).toLowerCase();
    const password = getStr(row.getCell(3).value);
    const roleRaw = getStr(row.getCell(4).value).toUpperCase();
    const nip = getStr(row.getCell(5).value);
    const jabatan = getStr(row.getCell(6).value);
    const mapel = getStr(row.getCell(7).value);
    const npsn = getStr(row.getCell(8).value);
    const statusRaw = getStr(row.getCell(9).value).toUpperCase();

    // Lewati baris kosong / baris petunjuk
    if (!nama || !email) continue;
    if (nama.toUpperCase().startsWith("PETUNJUK") || nama.toUpperCase().startsWith("CONTOH:")) continue;

    try {
      const role: "ADMIN" | "SUPERVISOR" | "GURU" = ["ADMIN", "SUPERVISOR", "GURU"].includes(roleRaw) ? (roleRaw as "ADMIN" | "SUPERVISOR" | "GURU") : "GURU";
      const aktif = statusRaw !== "NONAKTIF";
      const sekolah = npsn ? byNpsn.get(npsn) : undefined;
      if (npsn && !sekolah) {
        errors.push(`Baris ${i}: NPSN "${npsn}" tidak ditemukan (sekolah dilewati kolom ini)`);
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // UPDATE — password kosong berarti tidak diubah
        await prisma.user.update({
          where: { email },
          data: {
            nama,
            role,
            nip: nip || null,
            jabatan: jabatan || null,
            mapel: mapel || null,
            sekolahId: sekolah?.id ?? existing.sekolahId,
            aktif,
            ...(password && password.length >= 8 ? { password: await bcrypt.hash(password, 12) } : {}),
          },
        });
        results.updated++;
      } else {
        // CREATE
        if (password && password.length < 8) {
          errors.push(`Baris ${i}: password minimal 8 karakter (dilewati)`);
          results.failed++;
          continue;
        }
        await prisma.user.create({
          data: {
            nama,
            email,
            password: await bcrypt.hash(password || "supervisi123", 12),
            role,
            nip: nip || null,
            jabatan: jabatan || null,
            mapel: mapel || null,
            sekolahId: sekolah?.id ?? null,
            aktif,
          },
        });
        results.created++;
      }
    } catch (e) {
      results.failed++;
      errors.push(`Baris ${i}: gagal diproses`);
      console.error("Import error baris", i, e);
    }
  }

  const summary = `${results.created} pengguna baru dibuat, ${results.updated} diperbarui, ${results.failed} gagal.`;
  return NextResponse.json({ ...results, summary, errors: errors.slice(0, 20) }, { status: results.failed > 0 ? 207 : 200 });
}
