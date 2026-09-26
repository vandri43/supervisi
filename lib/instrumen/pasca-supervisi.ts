// Instrumen Pasca Supervisi — Refleksi & Evaluasi
// 27 indikator, 5 komponen (3M, BBM, AF, AS, RF)
// Skor maks 108, Nilai Akhir = (Total/108) x 100

export interface IndikatorPasca {
  no: number;
  deskripsi: string;
}

export interface KomponenPasca {
  kode: string;
  judul: string;
  indikator: IndikatorPasca[];
}

export const komponenPasca: KomponenPasca[] = [
  {
    kode: "3M",
    judul: "Observasi — Dimensi 3M (Memahami, Mengaplikasi, Merefleksi)",
    indikator: [
      { no: 1, deskripsi: "Guru mendorong peserta didik memahami konsep secara mendalam" },
      { no: 2, deskripsi: "Guru memfasilitasi aplikasi konsep pada konteks nyata" },
      { no: 3, deskripsi: "Guru mendorong peserta didik merefleksikan proses belajarnya" },
      { no: 4, deskripsi: "Pertanyaan guru mendorong berpikir tingkat tinggi (HOTS)" },
      { no: 5, deskripsi: "Terdapat transfer pengetahuan ke situasi baru" },
      { no: 6, deskripsi: "Umpan balik guru spesifik dan mendorong perbaikan" },
    ],
  },
  {
    kode: "BBM",
    judul: "Observasi — Dimensi BBM (Berkesadaran, Bermakna, Menggembirakan)",
    indikator: [
      { no: 1, deskripsi: "Peserta didik sadar tujuan belajar dan termotivasi (Berkesadaran)" },
      { no: 2, deskripsi: "Pembelajaran dikaitkan dengan pengalaman/konteks nyata (Bermakna)" },
      { no: 3, deskripsi: "Peserta didik mengonstruksi pengetahuan secara aktif (Bermakna)" },
      { no: 4, deskripsi: "Suasana kelas menyenangkan dan kondusif (Menggembirakan)" },
      { no: 5, deskripsi: "Terdapat kegiatan kolaboratif yang produktif" },
      { no: 6, deskripsi: "Peserta didik antusias dan terlibat aktif sepanjang pembelajaran" },
    ],
  },
  {
    kode: "AF",
    judul: "Asesmen Formatif",
    indikator: [
      { no: 1, deskripsi: "Guru melakukan cek pemahaman secara berkala selama pembelajaran" },
      { no: 2, deskripsi: "Asesmen formatif digunakan untuk menyesuaikan pembelajaran" },
      { no: 3, deskripsi: "Umpan balik formatif spesifik dan diterima baik oleh peserta didik" },
      { no: 4, deskripsi: "Peserta didik dilibatkan dalam proses asesmen (peer/self assessment)" },
      { no: 5, deskripsi: "Terdapat variasi bentuk asesmen formatif" },
      { no: 6, deskripsi: "Dokumentasi asesmen formatif tersedia dan terorganisir" },
    ],
  },
  {
    kode: "AS",
    judul: "Asesmen Sumatif",
    indikator: [
      { no: 1, deskripsi: "Instrumen asesmen sumatif sesuai dengan tujuan pembelajaran" },
      { no: 2, deskripsi: "Soal/tugas sumatif mengukur pemahaman mendalam (bukan hafalan)" },
      { no: 3, deskripsi: "Rubrik penilaian jelas dan dikomunikasikan kepada peserta didik" },
      { no: 4, deskripsi: "Hasil asesmen sumatif dianalisis dan ditindaklanjuti" },
    ],
  },
  {
    kode: "RF",
    judul: "Refleksi Dialog Pasca Supervisi",
    indikator: [
      { no: 1, deskripsi: "Guru mampu mengidentifikasi kekuatan pembelajaran yang dilaksanakan" },
      { no: 2, deskripsi: "Guru mampu mengidentifikasi area yang perlu ditingkatkan" },
      { no: 3, deskripsi: "Guru terbuka menerima umpan balik supervisor secara konstruktif" },
      { no: 4, deskripsi: "Guru merumuskan langkah perbaikan yang konkret dan realistis" },
      { no: 5, deskripsi: "Dialog berlangsung dua arah dan produktif" },
    ],
  },
];

export const SKOR_MAKS_PASCA = 108; // 27 indikator × 4

export function hitungNilaiPasca(totalSkor: number): { nilaiAkhir: number; predikat: string } {
  const nilaiAkhir = (totalSkor / SKOR_MAKS_PASCA) * 100;
  let predikat = "KURANG";
  if (nilaiAkhir >= 91) predikat = "SANGAT_BAIK";
  else if (nilaiAkhir >= 81) predikat = "BAIK";
  else if (nilaiAkhir >= 71) predikat = "CUKUP";
  return { nilaiAkhir, predikat };
}
