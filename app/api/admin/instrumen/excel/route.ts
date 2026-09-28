import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ambilInstrumen, ambilKonferensi, resetCacheInstrumen } from "@/lib/instrumen-db";

export const dynamic = "force-dynamic";

const SHEETS: Record<string, string> = {
  pra: "Pra Observasi",
  observasi: "Observasi Kelas",
  pasca: "Pasca Supervisi",
};
const SHEET_KONFERENSI = "Konferensi";

const HEADERS = ["Kode Komponen", "Judul Komponen", "No Indikator", "Deskripsi Indikator", "Dimensi", "Tag PM"];
const DIMENSI_VALID = ["Umum", "BBM", "3M", "Literasi", "Numerasi", "Asesmen"];

const onlyAdmin = (role?: string) => role === "ADMIN";

// ============ GET ?mode=template|export ============
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const mode = req.nextUrl.searchParams.get("mode") === "template" ? "template" : "export";
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistem Supervisi Guru";

  const buatSheetStage = (stage: string) => {
    const ws = wb.addWorksheet(SHEETS[stage]);
    ws.columns = [
      { header: HEADERS[0], key: "kode", width: 14 },
      { header: HEADERS[1], key: "judul", width: 40 },
      { header: HEADERS[2], key: "no", width: 12 },
      { header: HEADERS[3], key: "deskripsi", width: 70 },
      { header: HEADERS[4], key: "dimensi", width: 14 },
      { header: HEADERS[5], key: "tagPM", width: 12 },
    ];
    const h = ws.getRow(1);
    h.font = { bold: true, color: { argb: "FFFFFFFF" } };
    h.height = 20;
    h.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5E72E4" } };
      c.alignment = { vertical: "middle" };
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    return ws;
  };

  const sheets = {
    pra: buatSheetStage("pra"),
    observasi: buatSheetStage("observasi"),
    pasca: buatSheetStage("pasca"),
  };

  const wsKonf = wb.addWorksheet(SHEET_KONFERENSI);
  wsKonf.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Pertanyaan Konferensi", key: "pertanyaan", width: 90 },
  ];
  const hk = wsKonf.getRow(1);
  hk.font = { bold: true, color: { argb: "FFFFFFFF" } };
  hk.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2DCE89" } };
  });

  if (mode === "template") {
    // Contoh baris per sheet (italic abu-abu, boleh dihapus sebelum import)
    sheets.pra.addRow({
      kode: "A",
      judul: "Contoh: Identitas dan Tujuan Pembelajaran",
      no: 1,
      deskripsi: "Contoh: Identitas RPP/RPM lengkap (nama guru, kelas, mapel, semester, tahun ajaran)",
      dimensi: "Umum",
      tagPM: "",
    });
    sheets.pra.getRow(2).font = { italic: true, color: { argb: "FF999999" } };
    sheets.observasi.addRow({
      kode: "A",
      judul: "Contoh: Pembukaan",
      no: 1,
      deskripsi: "Contoh: Guru menyampaikan tujuan pembelajaran secara jelas",
      dimensi: "BBM",
      tagPM: "",
    });
    sheets.observasi.getRow(2).font = { italic: true, color: { argb: "FF999999" } };
    sheets.pasca.addRow({
      kode: "3M",
      judul: "Contoh: Observasi Dimensi 3M",
      no: 1,
      deskripsi: "Contoh: Guru mendorong peserta didik memahami konsep secara mendalam",
      dimensi: "Umum",
      tagPM: "",
    });
    sheets.pasca.getRow(2).font = { italic: true, color: { argb: "FF999999" } };

    wsKonf.addRow({ no: 1, pertanyaan: "Contoh: Apa tujuan utama yang ingin Bapak/Ibu capai dalam pembelajaran ini?" });
    wsKonf.getRow(2).font = { italic: true, color: { argb: "FF999999" } };

    // Sheet petunjuk
    const wsP = wb.addWorksheet("PETUNJUK");
    wsP.columns = [{ width: 110 }];
    const petunjuk = [
      "PETUNJUK IMPORT INSTRUMEN SUPERVISI",
      "",
      "1. Isi data pada sheet: 'Pra Observasi', 'Observasi Kelas', 'Pasca Supervisi', dan 'Konferensi'.",
      "2. Kode Komponen  : singkat, unik per sheet (mis. A, B, C atau 3M, BBM). Baris dengan kode & judul sama otomatis digabung menjadi satu komponen.",
      "3. Judul Komponen : wajib pada baris pertama komponen; baris lanjutan boleh mengulang atau dikosongkan.",
      "4. No Indikator   : angka urut dalam komponen (1, 2, 3, ...). Boong dikosongkan akan dinomori otomatis.",
      "5. Deskripsi      : wajib diisi — baris tanpa deskripsi dilewati.",
      "6. Dimensi        : hanya dipakai Observasi Kelas. Pilihan: Umum, BBM, 3M, Literasi, Numerasi, Asesmen. Selain itu dianggap 'Umum'.",
      "7. Tag PM         : opsional (mis. PM, Literasi, Numerasi).",
      "",
      "MODE IMPORT (pilih saat mengunggah):",
      "- GANTI (replace): seluruh instrumen tahap tersebut DIHAPUS lalu diganti isi file. Gunakan jika ingin menata ulang total.",
      "- GABUNG (merge) : isi file DITAMBAHKAN ke instrumen yang ada (komponen baru dibuat, indikator disambung ke komponen bernaung kode sama). Cocok untuk menambah tanpa menghapus.",
      "",
      "Baris contoh berwarna abu-abu miring boleh dihapus. Skor maksimum tiap tahap = jumlah indikator x 4 (otomatis).",
      "Setelah import, perubahan langsung berlaku untuk penilaian siklus baru. Data siklus yang sudah dinilai tidak berubah.",
    ];
    for (const baris of petunjuk) {
      const r = wsP.addRow(baris);
      r.font = baris.startsWith("PETUNJUK") || baris.startsWith("MODE") ? { bold: true } : { size: 11 };
    }
  } else {
    // Export data nyata dari DB
    for (const stage of ["pra", "observasi", "pasca"] as const) {
      const komponen = await ambilInstrumen(stage, true);
      for (const k of komponen) {
        for (const i of k.indikator) {
          sheets[stage].addRow({
            kode: k.kode,
            judul: k.judul,
            no: i.no,
            deskripsi: i.deskripsi,
            dimensi: i.dimensi ?? "Umum",
            tagPM: i.tagPM ?? "",
          });
        }
      }
    }
    const konferensi = await ambilKonferensi();
    konferensi.forEach((p, idx) => wsKonf.addRow({ no: idx + 1, pertanyaan: p }));
  }

  const fileName =
    mode === "template" ? "template-import-instrumen.xlsx" : "instrumen-supervisi.xlsx";

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ============ POST — import (multipart: file, mode=replace|merge) ============
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!onlyAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const mode = formData?.get("mode") === "merge" ? "merge" : "replace";

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

  const getStr = (v: ExcelJS.CellValue): string =>
    v === null || v === undefined ? "" : String(v).trim();

  interface ParsedInd {
    no: number | null;
    deskripsi: string;
    dimensi: string | null;
    tagPM: string | null;
  }
  interface ParsedKomp {
    kode: string;
    judul: string;
    indikator: ParsedInd[];
  }

  // Parse satu sheet stage
  const parseStage = (sheetName: string): { komponen: ParsedKomp[]; error?: string } => {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) return { komponen: [], error: `Sheet "${sheetName}" tidak ditemukan` };
    const komponen: ParsedKomp[] = [];
    let last: ParsedKomp | null = null;
    let noOtomatis = 0;

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // header
      const kode = getStr(row.getCell(1).value);
      const judul = getStr(row.getCell(2).value);
      const noCell = getStr(row.getCell(3).value);
      const deskripsi = getStr(row.getCell(4).value);
      const dimensi = getStr(row.getCell(5).value);
      const tagPM = getStr(row.getCell(6).value);

      if (!deskripsi) return; // baris kosong / contoh dilewati

      if (kode && (!last || last.kode.toUpperCase() !== kode.toUpperCase())) {
        noOtomatis = 0;
        const ada = komponen.find((k) => k.kode.toUpperCase() === kode.toUpperCase());
        if (ada) {
          last = ada;
          if (judul && !ada.judul) ada.judul = judul;
        } else {
          last = { kode: kode.slice(0, 10), judul: judul || kode, indikator: [] };
          komponen.push(last);
        }
      }
      if (!last) return;

      const noParsed = parseInt(noCell, 10);
      noOtomatis += 1;
      last.indikator.push({
        no: Number.isFinite(noParsed) && noParsed > 0 ? noParsed : noOtomatis,
        deskripsi,
        dimensi: DIMENSI_VALID.includes(dimensi) ? dimensi : "Umum",
        tagPM: tagPM || null,
      });
    });
    return { komponen };
  };

  const hasilStage: Record<string, ParsedKomp[]> = {};
  for (const stage of ["pra", "observasi", "pasca"] as const) {
    const p = parseStage(SHEETS[stage]);
    if (p.error && wb.getWorksheet(SHEET_KONFERENSI)) {
      // sheet stage hilang tapi file sah — dianggap tidak mengubah stage itu
      hasilStage[stage] = [];
      continue;
    }
    hasilStage[stage] = p.komponen;
  }

  // Parse konferensi
  const wsKonf = wb.getWorksheet(SHEET_KONFERENSI);
  const konferensiBaru: string[] = [];
  if (wsKonf) {
    wsKonf.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const p = getStr(row.getCell(2).value) || getStr(row.getCell(1).value);
      if (p) konferensiBaru.push(p.slice(0, 500));
    });
  }

  const totalBaris = Object.values(hasilStage).reduce((a, k) => a + k.reduce((b, c) => b + c.indikator.length, 0), 0);
  if (totalBaris === 0 && konferensiBaru.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada data terbaca. Pastikan mengisi sheet sesuai template (kolom Kode, Judul, No, Deskripsi)." },
      { status: 400 }
    );
  }

  // Konfirmasi penghapusan ditangani di UI (confirm sebelum kirim)
  try {
    const laporan: Record<string, { komponen: number; indikator: number }> = {};

    for (const stage of ["pra", "observasi", "pasca"] as const) {
      const komponen = hasilStage[stage];
      if (komponen.length === 0) continue;

      if (mode === "replace") {
        await prisma.instrumenKomponen.deleteMany({ where: { stage } });
      }

      let noKomp = await prisma.instrumenKomponen.count({ where: { stage } });
      for (const k of komponen) {
        let target = await prisma.instrumenKomponen.findUnique({
          where: { stage_kode: { stage, kode: k.kode } },
        });
        if (!target) {
          target = await prisma.instrumenKomponen.create({
            data: { stage, kode: k.kode, judul: k.judul, urutan: noKomp++ },
          });
        } else if (mode === "replace") {
          await prisma.instrumenKomponen.update({ where: { id: target.id }, data: { judul: k.judul } });
        }
        // nomor indikator harus unik per komponen — renomor berurutan
        let nomor = await prisma.instrumenIndikator.count({ where: { komponenId: target.id } });
        for (const ind of k.indikator) {
          nomor += 1;
          await prisma.instrumenIndikator.create({
            data: {
              komponenId: target.id,
              nomor,
              deskripsi: ind.deskripsi,
              dimensi: ind.dimensi,
              tagPM: ind.tagPM,
              urutan: nomor - 1,
            },
          });
        }
      }
      const jumlahK = await prisma.instrumenKomponen.count({ where: { stage } });
      const jumlahI = await prisma.instrumenIndikator.count({
        where: { komponen: { stage } },
      });
      laporan[stage] = { komponen: jumlahK, indikator: jumlahI };
    }

    if (konferensiBaru.length > 0) {
      await prisma.instrumenKonferensi.deleteMany({});
      let urutan = 0;
      for (const p of konferensiBaru) {
        await prisma.instrumenKonferensi.create({ data: { pertanyaan: p, urutan: urutan++ } });
      }
    }

    resetCacheInstrumen();

    return NextResponse.json({ success: true, mode, laporan });
  } catch (e) {
    console.error("Import instrumen gagal:", e);
    return NextResponse.json({ error: "Gagal mengimpor instrumen" }, { status: 500 });
  }
}
