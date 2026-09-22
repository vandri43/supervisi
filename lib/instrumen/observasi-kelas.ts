// Instrumen Observasi Kelas (Pemantauan)
// 44 indikator, 6 komponen A-F, 6 dimensi
// Skor maks 176, Nilai = (Total/176) × 100
// Predikat: ≤70=Kurang, 71-80=Cukup, 81-90=Baik, 91-100=Sangat Baik

export interface IndikatorObservasi {
  no: number;
  deskripsi: string;
  dimensi: "BBM" | "3M" | "Literasi" | "Numerasi" | "Asesmen" | "Umum";
}

export interface KomponenObservasi {
  kode: string;
  judul: string;
  indikator: IndikatorObservasi[];
}

export const komponenObservasi: KomponenObservasi[] = [
  {
    kode: "A",
    judul: "Pendahuluan Pembelajaran",
    indikator: [
      { no: 1, deskripsi: "Guru menyampaikan tujuan pembelajaran secara jelas kepada peserta didik", dimensi: "Umum" },
      { no: 2, deskripsi: "Guru membangun kesadaran belajar peserta didik (apersepsi bermakna)", dimensi: "BBM" },
      { no: 3, deskripsi: "Guru mengaitkan materi dengan konteks/pengalaman nyata peserta didik", dimensi: "BBM" },
      { no: 4, deskripsi: "Peserta didik termotivasi dan antusias mengikuti pembelajaran", dimensi: "BBM" },
      { no: 5, deskripsi: "Guru melakukan asesmen diagnostik/cek pengetahuan awal", dimensi: "Asesmen" },
      { no: 6, deskripsi: "Guru menciptakan suasana belajar yang nyaman dan aman psikologis", dimensi: "BBM" },
    ],
  },
  {
    kode: "B",
    judul: "Proses Pembelajaran — Pemahaman Mendalam (3M)",
    indikator: [
      { no: 1, deskripsi: "Guru mendorong peserta didik Memahami konsep secara mendalam (bukan hafalan)", dimensi: "3M" },
      { no: 2, deskripsi: "Guru memfasilitasi peserta didik Mengaplikasikan konsep pada situasi nyata", dimensi: "3M" },
      { no: 3, deskripsi: "Guru mendorong peserta didik Merefleksikan proses dan hasil belajarnya", dimensi: "3M" },
      { no: 4, deskripsi: "Pertanyaan guru mendorong berpikir kritis dan analitis (bukan hafalan)", dimensi: "3M" },
      { no: 5, deskripsi: "Kegiatan pembelajaran terstruktur dan sesuai dengan RPP/RPM", dimensi: "Umum" },
      { no: 6, deskripsi: "Guru memberikan waktu berpikir yang cukup (wait time) setelah bertanya", dimensi: "3M" },
      { no: 7, deskripsi: "Guru memberikan umpan balik spesifik dan konstruktif kepada peserta didik", dimensi: "Asesmen" },
      { no: 8, deskripsi: "Peserta didik aktif terlibat dalam kegiatan pembelajaran", dimensi: "BBM" },
    ],
  },
  {
    kode: "C",
    judul: "Pembelajaran Bermakna (Meaningful)",
    indikator: [
      { no: 1, deskripsi: "Pembelajaran menggunakan konteks otentik/masalah dunia nyata", dimensi: "BBM" },
      { no: 2, deskripsi: "Peserta didik mengonstruksi pengetahuan secara aktif (bukan pasif menerima)", dimensi: "BBM" },
      { no: 3, deskripsi: "Terdapat kegiatan kolaborasi/diskusi kelompok yang produktif", dimensi: "BBM" },
      { no: 4, deskripsi: "Guru memfasilitasi peserta didik membuat koneksi antar konsep", dimensi: "BBM" },
      { no: 5, deskripsi: "Peserta didik menunjukkan kemampuan transfer pengetahuan ke situasi baru", dimensi: "3M" },
    ],
  },
  {
    kode: "D",
    judul: "Pembelajaran Menggembirakan (Joyful)",
    indikator: [
      { no: 1, deskripsi: "Suasana kelas menyenangkan dan peserta didik tampak menikmati belajar", dimensi: "BBM" },
      { no: 2, deskripsi: "Guru menggunakan variasi metode/media yang menarik perhatian", dimensi: "BBM" },
      { no: 3, deskripsi: "Guru memberikan apresiasi/penguatan positif kepada peserta didik", dimensi: "BBM" },
      { no: 4, deskripsi: "Pembelajaran mengakomodasi gaya belajar yang beragam", dimensi: "BBM" },
      { no: 5, deskripsi: "Tidak ada ketegangan/tekanan berlebihan dalam kelas", dimensi: "BBM" },
    ],
  },
  {
    kode: "E",
    judul: "Integrasi Literasi dan Numerasi",
    indikator: [
      { no: 1, deskripsi: "Peserta didik membaca/menelaah teks dalam pembelajaran", dimensi: "Literasi" },
      { no: 2, deskripsi: "Peserta didik memproduksi/menulis teks atau laporan dalam pembelajaran", dimensi: "Literasi" },
      { no: 3, deskripsi: "Guru mendorong kemampuan berpikir kritis berbasis teks/informasi", dimensi: "Literasi" },
      { no: 4, deskripsi: "Terdapat penggunaan data/angka/grafik/tabel dalam pembelajaran", dimensi: "Numerasi" },
      { no: 5, deskripsi: "Peserta didik menganalisis atau menginterpretasi data kuantitatif", dimensi: "Numerasi" },
      { no: 6, deskripsi: "Literasi dan numerasi diintegrasikan secara alami dalam mapel", dimensi: "Literasi" },
      { no: 7, deskripsi: "Guru menggunakan pertanyaan berbasis data/teks untuk mendorong penalaran", dimensi: "Numerasi" },
    ],
  },
  {
    kode: "F",
    judul: "Asesmen dan Penutup Pembelajaran",
    indikator: [
      { no: 1, deskripsi: "Guru melakukan asesmen selama proses pembelajaran (formatif)", dimensi: "Asesmen" },
      { no: 2, deskripsi: "Asesmen mengukur pemahaman mendalam (bukan hanya mengingat)", dimensi: "Asesmen" },
      { no: 3, deskripsi: "Guru menyesuaikan langkah pembelajaran berdasarkan hasil asesmen", dimensi: "Asesmen" },
      { no: 4, deskripsi: "Peserta didik melakukan refleksi atas proses belajarnya sendiri", dimensi: "3M" },
      { no: 5, deskripsi: "Guru merangkum/menguatkan pembelajaran di bagian penutup", dimensi: "Umum" },
      { no: 6, deskripsi: "Pembelajaran ditutup dengan tindak lanjut/penugasan yang bermakna", dimensi: "BBM" },
      { no: 7, deskripsi: "Guru memberikan kesempatan peserta didik untuk bertanya/merespons di akhir", dimensi: "3M" },
    ],
  },
];

export const SKOR_MAKS_OBSERVASI = 176; // 44 indikator × 4

export function hitungNilaiObservasi(totalSkor: number): { nilaiAkhir: number; predikat: string } {
  const nilaiAkhir = (totalSkor / SKOR_MAKS_OBSERVASI) * 100;
  let predikat = "KURANG";
  if (nilaiAkhir >= 91) predikat = "SANGAT_BAIK";
  else if (nilaiAkhir >= 81) predikat = "BAIK";
  else if (nilaiAkhir >= 71) predikat = "CUKUP";
  return { nilaiAkhir, predikat };
}

export const labelDimensi: Record<string, string> = {
  BBM: "Berkesadaran-Bermakna-Menggembirakan",
  "3M": "Memahami-Mengaplikasi-Merefleksi",
  Literasi: "Literasi",
  Numerasi: "Numerasi",
  Asesmen: "Asesmen",
  Umum: "Umum",
};
