// Instrumen Pra Observasi — Telaah RPP/RPM
// 45 indikator, 10 komponen A-J
// Skor maks 180, Nilai Akhir = (Total/180) x 100

export interface Indikator {
  no: number;
  deskripsi: string;
  tagPM?: string; // Keterkaitan PM/Literasi/Numerasi
}

export interface Komponen {
  kode: string;
  judul: string;
  indikator: Indikator[];
}

export const komponenPraObservasi: Komponen[] = [
  {
    kode: "A",
    judul: "Identitas dan Tujuan Pembelajaran",
    indikator: [
      { no: 1, deskripsi: "Identitas RPP/RPM lengkap (nama guru, kelas, mapel, semester, tahun ajaran)" },
      { no: 2, deskripsi: "Tujuan pembelajaran dirumuskan secara jelas dan terukur (ABCD/SMART)" },
      { no: 3, deskripsi: "Tujuan pembelajaran mencerminkan tingkatan berpikir tinggi (HOTS)" },
      { no: 4, deskripsi: "Tujuan pembelajaran relevan dengan kompetensi dasar/capaian pembelajaran", tagPM: "PM" },
    ],
  },
  {
    kode: "B",
    judul: "Materi dan Bahan Ajar",
    indikator: [
      { no: 1, deskripsi: "Materi pokok sesuai dengan capaian pembelajaran dan tujuan" },
      { no: 2, deskripsi: "Bahan ajar bervariasi (teks, gambar, video, media digital)" },
      { no: 3, deskripsi: "Materi mengintegrasikan konteks nyata/autentik dalam kehidupan", tagPM: "PM" },
      { no: 4, deskripsi: "Bahan ajar mengandung unsur literasi (teks informasi, grafik, tabel)", tagPM: "Literasi" },
      { no: 5, deskripsi: "Bahan ajar mengandung unsur numerasi (data, pengukuran, perhitungan)", tagPM: "Numerasi" },
    ],
  },
  {
    kode: "C",
    judul: "Metode dan Model Pembelajaran",
    indikator: [
      { no: 1, deskripsi: "Model pembelajaran yang dipilih sesuai dengan tujuan dan materi" },
      { no: 2, deskripsi: "Metode pembelajaran bervariasi dan interaktif (diskusi, proyek, inkuiri)" },
      { no: 3, deskripsi: "Pembelajaran dirancang berbasis masalah/proyek nyata (PBL/PjBL)", tagPM: "PM" },
      { no: 4, deskripsi: "Pembelajaran mendorong peserta didik aktif berpikir kritis dan kreatif", tagPM: "PM" },
    ],
  },
  {
    kode: "D",
    judul: "Langkah-langkah Pembelajaran (Berkesadaran / Mindful)",
    indikator: [
      { no: 1, deskripsi: "Kegiatan pendahuluan membangun kesadaran dan motivasi belajar peserta didik", tagPM: "PM" },
      { no: 2, deskripsi: "Kegiatan inti dirancang untuk mendorong pemahaman mendalam", tagPM: "PM" },
      { no: 3, deskripsi: "Setiap langkah pembelajaran memiliki alokasi waktu yang proporsional" },
      { no: 4, deskripsi: "Kegiatan penutup memuat refleksi dan penguatan pembelajaran", tagPM: "PM" },
    ],
  },
  {
    kode: "E",
    judul: "Langkah Pembelajaran Bermakna (Meaningful)",
    indikator: [
      { no: 1, deskripsi: "Pembelajaran dikaitkan dengan pengalaman/pengetahuan awal peserta didik", tagPM: "PM" },
      { no: 2, deskripsi: "Kegiatan pembelajaran mendorong peserta didik mengonstruksi pengetahuan sendiri", tagPM: "PM" },
      { no: 3, deskripsi: "Terdapat kegiatan kolaboratif/kerja sama antar peserta didik" },
      { no: 4, deskripsi: "Pembelajaran mendorong transfer pengetahuan ke situasi baru", tagPM: "PM" },
    ],
  },
  {
    kode: "F",
    judul: "Langkah Pembelajaran Menggembirakan (Joyful)",
    indikator: [
      { no: 1, deskripsi: "Pembelajaran menggunakan pendekatan yang menyenangkan dan menarik", tagPM: "PM" },
      { no: 2, deskripsi: "Terdapat variasi kegiatan yang mengakomodasi gaya belajar berbeda" },
      { no: 3, deskripsi: "Lingkungan belajar yang aman secara psikologis terencana dengan baik", tagPM: "PM" },
    ],
  },
  {
    kode: "G",
    judul: "Integrasi Literasi",
    indikator: [
      { no: 1, deskripsi: "Terdapat kegiatan membaca/menelaah teks (informasi/fiksi) dalam pembelajaran", tagPM: "Literasi" },
      { no: 2, deskripsi: "Peserta didik direncanakan untuk menulis/memproduksi teks dalam pembelajaran", tagPM: "Literasi" },
      { no: 3, deskripsi: "Kegiatan literasi terintegrasi dalam tujuan mapel (bukan berdiri sendiri)", tagPM: "Literasi" },
      { no: 4, deskripsi: "Pertanyaan/tugas mendorong kemampuan berpikir kritis berbasis teks", tagPM: "Literasi" },
    ],
  },
  {
    kode: "H",
    judul: "Integrasi Numerasi",
    indikator: [
      { no: 1, deskripsi: "Terdapat kegiatan menggunakan angka/data/statistik dalam pembelajaran", tagPM: "Numerasi" },
      { no: 2, deskripsi: "Peserta didik direncanakan untuk menganalisis data/membuat grafik/menghitung", tagPM: "Numerasi" },
      { no: 3, deskripsi: "Kegiatan numerasi relevan dan kontekstual dalam mapel tersebut", tagPM: "Numerasi" },
      { no: 4, deskripsi: "Pertanyaan/tugas mendorong penalaran matematis/kuantitatif", tagPM: "Numerasi" },
    ],
  },
  {
    kode: "I",
    judul: "Asesmen Formatif",
    indikator: [
      { no: 1, deskripsi: "Terdapat rencana asesmen di awal pembelajaran (asesmen diagnostik)" },
      { no: 2, deskripsi: "Terdapat asesmen selama proses pembelajaran (cek pemahaman, kuis, observasi)" },
      { no: 3, deskripsi: "Umpan balik (feedback) direncanakan secara spesifik dan konstruktif" },
      { no: 4, deskripsi: "Asesmen formatif digunakan untuk menyesuaikan langkah pembelajaran", tagPM: "PM" },
    ],
  },
  {
    kode: "J",
    judul: "Asesmen Sumatif",
    indikator: [
      { no: 1, deskripsi: "Terdapat rencana asesmen sumatif yang jelas dan sesuai tujuan pembelajaran" },
      { no: 2, deskripsi: "Instrumen asesmen sumatif mengukur kemampuan berpikir tinggi (HOTS)" },
      { no: 3, deskripsi: "Rubrik/kriteria penilaian dideskripsikan dengan jelas" },
      { no: 4, deskripsi: "Asesmen sumatif mencerminkan prinsip keadilan dan objektivitas" },
    ],
  },
];

export const pertanyaanKonferensi = [
  "Apa tujuan utama yang ingin Bapak/Ibu capai dalam pembelajaran ini?",
  "Bagaimana Bapak/Ibu memastikan peserta didik memahami materi secara mendalam (bukan hafalan)?",
  "Strategi apa yang digunakan untuk mengintegrasikan literasi dan numerasi dalam pembelajaran ini?",
  "Bagaimana Bapak/Ibu merencanakan diferensiasi untuk peserta didik dengan kebutuhan berbeda?",
  "Apa tantangan yang mungkin dihadapi dan bagaimana antisipasinya?",
  "Bagaimana Bapak/Ibu akan mengetahui apakah peserta didik sudah mencapai tujuan pembelajaran?",
  "Hal apa yang ingin Bapak/Ibu perbaiki dari perencanaan ini berdasarkan pengalaman sebelumnya?",
];

export const SKOR_MAKS_PRA = 180; // 45 indikator × 4

export function hitungNilaiPra(totalSkor: number): { nilaiAkhir: number; predikat: string } {
  const nilaiAkhir = (totalSkor / SKOR_MAKS_PRA) * 100;
  let predikat = "KURANG";
  if (nilaiAkhir >= 91) predikat = "SANGAT_BAIK";
  else if (nilaiAkhir >= 81) predikat = "BAIK";
  else if (nilaiAkhir >= 71) predikat = "CUKUP";
  return { nilaiAkhir, predikat };
}
