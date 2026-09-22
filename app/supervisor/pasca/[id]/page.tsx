"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { Save, ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

// Komponen pasca supervisi (berdasarkan instrumen file Excel)
const komponenPasca = [
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

type SkorMap = Record<string, number>;

interface RTLItem {
  aspek: string;
  temuan: string;
  rencana: string;
  target: string;
  deadline: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PascaSupervisiPage(_props: { params: { id: string } }) {
  const router = useRouter();
  const [openKomponen, setOpenKomponen] = useState<string>("3M");
  const [skor, setSkor] = useState<SkorMap>({});
  const [catatan, setCatatan] = useState<Record<string, string>>({});
  const [catatanUmum, setCatatanUmum] = useState("");
  const [rtlItems, setRtlItems] = useState<RTLItem[]>([
    { aspek: "", temuan: "", rencana: "", target: "", deadline: "" },
  ]);

  const totalIndikator = komponenPasca.reduce((a, k) => a + k.indikator.length, 0);
  const diisi = Object.values(skor).filter((v) => v > 0).length;
  const totalSkor = Object.values(skor).reduce((a, b) => a + b, 0);
  const skorMaks = totalIndikator * 4;
  const nilaiAkhir = skorMaks > 0 ? (totalSkor / skorMaks) * 100 : 0;

  function getPredikat(nilai: number) {
    if (nilai >= 91) return { label: "Sangat Baik", variant: "success" as const };
    if (nilai >= 81) return { label: "Baik", variant: "primary" as const };
    if (nilai >= 71) return { label: "Cukup", variant: "warning" as const };
    return { label: "Kurang", variant: "danger" as const };
  }

  function getSkorKomponen(kode: string) {
    const k = komponenPasca.find((k) => k.kode === kode);
    if (!k) return { total: 0, maks: 0 };
    const total = k.indikator.reduce((a, ind) => a + (skor[`${kode}-${ind.no}`] ?? 0), 0);
    return { total, maks: k.indikator.length * 4 };
  }

  function addRTL() {
    setRtlItems((prev) => [...prev, { aspek: "", temuan: "", rencana: "", target: "", deadline: "" }]);
  }

  function removeRTL(index: number) {
    setRtlItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRTL(index: number, field: keyof RTLItem, value: string) {
    setRtlItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  const predikat = getPredikat(nilaiAkhir);

  return (
    <DashboardLayout
      pageTitle="Pasca Supervisi"
      breadcrumbs={[
        { label: "Supervisor" },
        { label: "Siklus", href: "/supervisor/siklus" },
        { label: "Pasca Supervisi" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <Link href="/supervisor/siklus" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke siklus
        </Link>

        {/* Header */}
        <div className="card mb-5">
          <div className="card-body flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Guru yang disupervisi</p>
              <p className="font-bold text-gray-800">Siti Rahayu, S.Pd</p>
              <p className="text-xs text-gray-500">DKV · X-DKV-1 · Topik: Desain Poster Digital</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Progress</p>
              <p className="text-2xl font-bold text-indigo-600">{diisi}/{totalIndikator}</p>
            </div>
          </div>
          <div className="px-6 pb-4">
            <ProgressBar value={(diisi / totalIndikator) * 100} showLabel size="md" />
          </div>
        </div>

        {/* Nilai sementara */}
        {diisi > 0 && (
          <div
            className="rounded-xl p-5 mb-5 text-white flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "linear-gradient(87deg, #fb6340 0, #fbb140 100%)" }}
          >
            <div>
              <p className="text-white/70 text-sm">Total Skor</p>
              <p className="text-4xl font-bold">{totalSkor} <span className="text-lg opacity-60">/ {skorMaks}</span></p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Nilai Akhir</p>
              <p className="text-4xl font-bold">{nilaiAkhir.toFixed(1)}</p>
              <Badge variant={predikat.variant} className="bg-white/20 text-white">{predikat.label}</Badge>
            </div>
          </div>
        )}

        {/* Instrumen */}
        <div className="space-y-3 mb-5">
          {komponenPasca.map((k) => {
            const { total, maks } = getSkorKomponen(k.kode);
            const isOpen = openKomponen === k.kode;
            return (
              <div key={k.kode} className="card overflow-hidden">
                <button
                  onClick={() => setOpenKomponen(isOpen ? "" : k.kode)}
                  className="w-full card-header flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {k.kode}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{k.judul}</p>
                      <p className="text-xs text-gray-400">{k.indikator.length} indikator · {total}/{maks}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {maks > 0 && <div className="w-20"><ProgressBar value={(total / maks) * 100} color="warning" /></div>}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="divide-y divide-gray-50">
                    {k.indikator.map((ind) => {
                      const key = `${k.kode}-${ind.no}`;
                      const val = skor[key] ?? 0;
                      return (
                        <div key={key} className="px-6 py-4">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-xs font-bold text-gray-400 flex-shrink-0 mt-0.5">{k.kode}{ind.no}</span>
                            <p className="text-sm text-gray-700">{ind.deskripsi}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-8 flex-wrap">
                            {[1, 2, 3, 4].map((s) => (
                              <button
                                key={s}
                                onClick={() => setSkor((prev) => ({ ...prev, [key]: val === s ? 0 : s }))}
                                className={`w-8 h-8 rounded-full text-sm font-bold border-2 transition-all ${
                                  val === s
                                    ? s === 1 ? "bg-red-500 border-red-500 text-white"
                                      : s === 2 ? "bg-orange-500 border-orange-500 text-white"
                                      : s === 3 ? "bg-blue-500 border-blue-500 text-white"
                                      : "bg-green-500 border-green-500 text-white"
                                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                                }`}
                              >{s}</button>
                            ))}
                            <span className="text-xs text-gray-400 ml-1">
                              {["", "Belum Terlihat", "Mulai Berkembang", "Baik", "Sangat Baik"][val] ?? "Belum diisi"}
                            </span>
                          </div>
                          <div className="ml-8 mt-2">
                            <input
                              type="text"
                              placeholder="Catatan..."
                              value={catatan[key] ?? ""}
                              onChange={(e) => setCatatan((prev) => ({ ...prev, [key]: e.target.value }))}
                              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-orange-300 text-gray-600 placeholder-gray-300"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Catatan umum */}
        <div className="card mb-5">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm">Catatan Umum & Refleksi Dialog</h3>
          </div>
          <div className="card-body">
            <textarea
              rows={4}
              className="form-input"
              placeholder="Tuliskan catatan umum hasil dialog pasca supervisi..."
              value={catatanUmum}
              onChange={(e) => setCatatanUmum(e.target.value)}
            />
          </div>
        </div>

        {/* RTL Section */}
        <div className="card mb-24">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-gray-800 font-bold text-sm">Rencana Tindak Lanjut (RTL)</h3>
              <p className="text-gray-400 text-xs">Rumuskan RTL berdasarkan temuan supervisi</p>
            </div>
            <button onClick={addRTL} className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              Tambah RTL
            </button>
          </div>
          <div className="card-body space-y-5">
            {rtlItems.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-700">RTL #{i + 1}</p>
                  {rtlItems.length > 1 && (
                    <button
                      onClick={() => removeRTL(i)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Aspek yang Ditingkatkan</label>
                      <input
                        className="form-input"
                        value={item.aspek}
                        onChange={(e) => updateRTL(i, "aspek", e.target.value)}
                        placeholder="Contoh: Numerasi, Asesmen Formatif"
                      />
                    </div>
                    <div>
                      <label className="form-label">Deadline</label>
                      <input
                        type="date"
                        className="form-input"
                        value={item.deadline}
                        onChange={(e) => updateRTL(i, "deadline", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Temuan</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={item.temuan}
                      onChange={(e) => updateRTL(i, "temuan", e.target.value)}
                      placeholder="Deskripsikan temuan/masalah yang perlu ditindaklanjuti..."
                    />
                  </div>
                  <div>
                    <label className="form-label">Rencana Tindak Lanjut</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={item.rencana}
                      onChange={(e) => updateRTL(i, "rencana", e.target.value)}
                      placeholder="Langkah konkret yang akan dilakukan guru..."
                    />
                  </div>
                  <div>
                    <label className="form-label">Target Pencapaian</label>
                    <input
                      className="form-input"
                      value={item.target}
                      onChange={(e) => updateRTL(i, "target", e.target.value)}
                      placeholder="Indikator keberhasilan RTL..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky save */}
        <div className="fixed bottom-4 right-6 z-30">
          <div className="card px-6 py-3 flex items-center gap-3 shadow-xl">
            <span className="text-sm text-gray-500">
              <strong className="text-gray-700">{diisi}</strong>/{totalIndikator} diisi
            </span>
            <button
              className="btn bg-gray-100 text-gray-600 hover:bg-gray-200"
              onClick={() => router.push("/supervisor/siklus")}
            >
              Draft
            </button>
            <button
              disabled={diisi < totalIndikator}
              className="btn-warning"
              onClick={() => router.push("/supervisor/siklus")}
            >
              <Save className="w-4 h-4" />
              Selesaikan Siklus
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
