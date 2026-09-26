import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { komponenPraObservasi } from "@/lib/instrumen/pra-observasi";
import { komponenObservasi } from "@/lib/instrumen/observasi-kelas";
import { komponenPasca } from "@/lib/instrumen/pasca-supervisi";

type Params = { params: { id: string } };

// GET /api/siklus/[id]/cetak — data lengkap untuk printout laporan supervisi
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const siklus = await prisma.siklus.findUnique({
    where: { id: params.id },
    include: {
      guru: true,
      supervisor: true,
      sekolah: true,
      praObservasi: { include: { indikator: true, konferensi: true } },
      observasiKelas: { include: { indikator: true } },
      pascaSupervisi: { include: { indikator: true, rtl: true } },
    },
  });

  if (!siklus) {
    return NextResponse.json({ error: "Siklus tidak ditemukan" }, { status: 404 });
  }
  const boleh =
    session.user.role === "ADMIN" || siklus.supervisorId === session.user.id || siklus.guruId === session.user.id;
  if (!boleh) {
    return NextResponse.json({ error: "Anda tidak memiliki akses ke laporan ini" }, { status: 403 });
  }

  // Peta deskripsi indikator dari instrumen (untuk melengkapi data lama yang tersimpan "-")
  const mapDeskripsi = (komponen: { kode: string; indikator: { no: number; deskripsi: string }[] }[]) => {
    const m = new Map<string, string>();
    for (const k of komponen) for (const ind of k.indikator) m.set(`${k.kode}-${ind.no}`, ind.deskripsi);
    return m;
  };
  const deskripsiPra = mapDeskripsi(komponenPraObservasi);
  const deskripsiObs = mapDeskripsi(komponenObservasi);
  const deskripsiPasca = mapDeskripsi(komponenPasca);

  // Kelompokkan indikator per komponen, urut berdasarkan nomor indikator
  const kelompok = (
    indikator: { komponen: string; nomorIndikator: number; deskripsi: string; skor: number; catatan: string | null; dimensi?: string }[],
    deskripsiRef?: Map<string, string>
  ) => {
    const map = new Map<string, { nomor: number; deskripsi: string; skor: number; catatan: string | null }[]>();
    for (const i of indikator) {
      if (!map.has(i.komponen)) map.set(i.komponen, []);
      const ref = deskripsiRef?.get(`${i.komponen}-${i.nomorIndikator}`);
      map.get(i.komponen)!.push({
        nomor: i.nomorIndikator,
        deskripsi: !i.deskripsi || i.deskripsi === "-" ? ref ?? "-" : i.deskripsi,
        skor: i.skor,
        catatan: i.catatan,
      });
    }
    return Array.from(map.entries()).map(([kode, rows]) => {
      rows.sort((a, b) => a.nomor - b.nomor);
      const total = rows.reduce((a, r) => a + r.skor, 0);
      return { kode, rows, total, maks: rows.length * 4, persen: rows.length > 0 ? Math.round((total / (rows.length * 4)) * 100) : 0 };
    });
  };

  return NextResponse.json({
    dicetakPada: new Date().toISOString(),
    dicetakOleh: session.user.name,
    siklus: {
      id: siklus.id,
      tahunAjaran: siklus.tahunAjaran,
      semester: siklus.semester,
      status: siklus.status,
      kelas: siklus.kelas,
      mapel: siklus.mapel,
      topikPembelajaran: siklus.topikPembelajaran,
      tanggalMulai: siklus.tanggalMulai,
      tanggalSelesai: siklus.tanggalSelesai,
      catatan: siklus.catatan,
      guru: {
        nama: siklus.guru.nama,
        nip: siklus.guru.nip,
        jabatan: siklus.guru.jabatan,
        mapel: siklus.guru.mapel,
      },
      supervisor: {
        nama: siklus.supervisor.nama,
        nip: siklus.supervisor.nip,
        jabatan: siklus.supervisor.jabatan,
      },
      sekolah: siklus.sekolah
        ? { nama: siklus.sekolah.nama, npsn: siklus.sekolah.npsn, alamat: siklus.sekolah.alamat, kabupaten: siklus.sekolah.kabupaten, provinsi: siklus.sekolah.provinsi }
        : null,
    },
    praObservasi: siklus.praObservasi
      ? {
          tanggal: siklus.praObservasi.tanggal,
          totalSkor: siklus.praObservasi.totalSkor,
          nilaiAkhir: siklus.praObservasi.nilaiAkhir,
          predikat: siklus.praObservasi.predikat,
          selesai: siklus.praObservasi.selesai,
          catatanUmum: siklus.praObservasi.catatanUmum,
          komponen: kelompok(siklus.praObservasi.indikator, deskripsiPra),
          konferensi: siklus.praObservasi.konferensi
            .sort((a, b) => a.nomorPertanyaan - b.nomorPertanyaan)
            .map((k) => ({ nomor: k.nomorPertanyaan, pertanyaan: k.pertanyaan, jawaban: k.jawaban })),
        }
      : null,
    observasiKelas: siklus.observasiKelas
      ? {
          tanggal: siklus.observasiKelas.tanggal,
          totalSkor: siklus.observasiKelas.totalSkor,
          skorMaks: siklus.observasiKelas.skorMaks,
          nilaiAkhir: siklus.observasiKelas.nilaiAkhir,
          predikat: siklus.observasiKelas.predikat,
          selesai: siklus.observasiKelas.selesai,
          catatanUmum: siklus.observasiKelas.catatanUmum,
          komponen: kelompok(siklus.observasiKelas.indikator, deskripsiObs),
        }
      : null,
    pascaSupervisi: siklus.pascaSupervisi
      ? {
          tanggal: siklus.pascaSupervisi.tanggal,
          totalSkor: siklus.pascaSupervisi.totalSkor,
          nilaiAkhir: siklus.pascaSupervisi.nilaiAkhir,
          predikat: siklus.pascaSupervisi.predikat,
          selesai: siklus.pascaSupervisi.selesai,
          catatanUmum: siklus.pascaSupervisi.catatanUmum,
          komponen: kelompok(siklus.pascaSupervisi.indikator, deskripsiPasca),
          rtl: siklus.pascaSupervisi.rtl.map((r) => ({
            aspek: r.aspek,
            temuan: r.temuan,
            rencana: r.rencana,
            target: r.target,
            deadline: r.deadline,
            statusMonitoring: r.statusMonitoring,
            hasilMonitoring: r.hasilMonitoring,
          })),
        }
      : null,
  });
}
