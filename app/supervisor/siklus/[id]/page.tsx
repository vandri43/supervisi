"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FotoDokumentasi from "@/components/FotoDokumentasi";
import BuktiTugasPanel from "@/components/BuktiTugasPanel";
import Badge, { predikatBadge, statusBadge } from "@/components/ui/Badge";
import {
  ArrowLeft, Loader2, Trash2, User, School, Calendar, BookOpen,
  FileSearch, Eye, ClipboardCheck, ChevronRight, AlertTriangle, Printer,
  Paperclip, Camera,
} from "lucide-react";

interface SiklusDetail {
  id: string;
  tahunAjaran: string;
  semester: "GANJIL" | "GENAP";
  status: string;
  kelas: string | null;
  mapel: string | null;
  topikPembelajaran: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  catatan: string | null;
  guru: { id: string; nama: string; email: string; nip: string | null; jabatan: string | null; mapel: string | null };
  supervisor: { id: string; nama: string; email: string; nip: string | null; jabatan: string | null };
  sekolah: { id: string; nama: string; npsn: string | null; kabupaten: string | null; provinsi: string | null } | null;
  praObservasi: { id: string; tanggal: string | null; totalSkor: number; nilaiAkhir: number; predikat: string | null; selesai: boolean; catatanUmum: string | null } | null;
  observasiKelas: { id: string; tanggal: string | null; totalSkor: number; skorMaks: number; nilaiAkhir: number; predikat: string | null; selesai: boolean; catatanUmum: string | null } | null;
  pascaSupervisi: {
    id: string;
    tanggal: string | null;
    totalSkor: number;
    nilaiAkhir: number;
    predikat: string | null;
    selesai: boolean;
    catatanUmum: string | null;
    rtl: { id: string; aspek: string; rencana: string; target: string | null; deadline: string | null; statusMonitoring: string }[];
  } | null;
}

const steps = [
  { key: "PRA", label: "Pra Observasi", icon: FileSearch, desc: "Telaah RPP/RPM & konferensi awal", href: "pra-observasi" },
  { key: "OBS", label: "Observasi Kelas", icon: Eye, desc: "Penilaian kinerja guru di kelas", href: "observasi" },
  { key: "PASCA", label: "Pasca Supervisi", icon: ClipboardCheck, desc: "Refleksi, umpan balik & RTL", href: "pasca" },
];

function statusToStep(status: string): number {
  switch (status) {
    case "DRAFT": return -1;
    case "PRA_OBSERVASI": return 0;
    case "OBSERVASI": return 1;
    case "PASCA_SUPERVISI": return 2;
    case "SELESAI": return 3;
    default: return -1;
  }
}

export default function SiklusDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<SiklusDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/siklus/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat detail siklus");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat detail siklus");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDelete = async () => {
    if (!data) return;
    if (!confirm(`Hapus siklus supervisi untuk ${data.guru.nama}? Seluruh data pra observasi, observasi, dan pasca supervisi pada siklus ini akan ikut terhapus.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/siklus/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus siklus");
      router.push("/supervisor/siklus");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus siklus");
      setDeleting(false);
    }
  };

  const fmtTanggal = (t: string | null) =>
    t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

  if (loading) {
    return (
      <DashboardLayout pageTitle="Detail Siklus" breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: "Detail" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat detail siklus...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Detail Siklus" breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: "Detail" }]}>
        <div className="max-w-lg mx-auto card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 text-sm mb-4">{error || "Siklus tidak ditemukan"}</p>
          <Link href="/supervisor/siklus" className="btn-primary inline-flex">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Siklus
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const sb = statusBadge(data.status);
  const currentStep = statusToStep(data.status);
  const nilaiSiklus = data.pascaSupervisi?.selesai
    ? data.pascaSupervisi.nilaiAkhir
    : data.observasiKelas?.selesai
    ? data.observasiKelas.nilaiAkhir
    : data.praObservasi?.selesai
    ? data.praObservasi.nilaiAkhir
    : null;
  const predikatSiklus = data.pascaSupervisi?.selesai
    ? data.pascaSupervisi.predikat
    : data.observasiKelas?.selesai
    ? data.observasiKelas.predikat
    : data.praObservasi?.selesai
    ? data.praObservasi.predikat
    : null;
  const pb = predikatSiklus ? predikatBadge(predikatSiklus) : null;

  const stageInfo = (i: number) => {
    if (currentStep > i) return { done: true, active: false };
    if (currentStep === i) return { done: false, active: true };
    if (currentStep === 3) return { done: true, active: false };
    return { done: false, active: false };
  };

  return (
    <DashboardLayout
      pageTitle="Detail Siklus Supervisi"
      breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus", href: "/supervisor/siklus" }, { label: data.guru.nama }]}
    >
      <div className="max-w-4xl mx-auto">
        <Link href="/supervisor/siklus" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke daftar siklus
        </Link>

        {/* Header card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-800">{data.guru.nama}</h2>
                <Badge variant={sb.variant as "success" | "warning" | "danger" | "info" | "primary" | "default"}>{sb.label}</Badge>
                {pb && <Badge variant={pb.variant as "success" | "warning" | "danger" | "info" | "primary" | "default"}>{pb.label}</Badge>}
              </div>
              <p className="text-sm text-gray-500">
                {data.mapel ?? "-"} · {data.kelas ?? "-"} · T.A. {data.tahunAjaran} Semester {data.semester === "GANJIL" ? "Ganjil" : "Genap"}
              </p>
              {data.topikPembelajaran && (
                <p className="text-xs text-gray-400 italic mt-1">&quot;{data.topikPembelajaran}&quot;</p>
              )}
            </div>
            {nilaiSiklus !== null && (
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-800">{nilaiSiklus.toFixed(1)}</p>
                <p className="text-xs text-gray-400">Nilai Akhir</p>
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs">
                <p className="text-gray-400 mb-0.5">Supervisor</p>
                <p className="text-gray-700 font-medium">{data.supervisor.nama}</p>
                <p className="text-gray-400">{data.supervisor.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <School className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs">
                <p className="text-gray-400 mb-0.5">Sekolah</p>
                <p className="text-gray-700 font-medium">{data.sekolah?.nama ?? "-"}</p>
                <p className="text-gray-400">{data.sekolah?.kabupaten ?? ""}{data.sekolah?.provinsi ? `, ${data.sekolah.provinsi}` : ""}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs">
                <p className="text-gray-400 mb-0.5">Tanggal</p>
                <p className="text-gray-700 font-medium">Mulai: {fmtTanggal(data.tanggalMulai)}</p>
                <p className="text-gray-400">Selesai: {fmtTanggal(data.tanggalSelesai)}</p>
              </div>
            </div>
          </div>

          {data.catatan && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
              <p className="font-semibold text-gray-500 mb-1">Catatan</p>
              {data.catatan}
            </div>
          )}
        </div>

        {/* Tahapan siklus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {steps.map((step, i) => {
            const st = stageInfo(i);
            const detail =
              i === 0 ? data.praObservasi : i === 1 ? data.observasiKelas : data.pascaSupervisi;
            const Icon = step.icon;
            return (
              <div key={step.key} className={`card p-5 ${st.active ? "ring-2 ring-indigo-400" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    st.done ? "bg-green-50 text-green-600" : st.active ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-300"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {st.done ? (
                    <Badge variant="success">Selesai</Badge>
                  ) : st.active ? (
                    <Badge variant="primary">Sedang Berjalan</Badge>
                  ) : (
                    <Badge variant="default">Belum</Badge>
                  )}
                </div>
                <h4 className="text-gray-800 font-semibold text-sm">{step.label}</h4>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">{step.desc}</p>
                {detail ? (
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Nilai: <span className="font-semibold text-gray-700">{detail.nilaiAkhir.toFixed(1)}</span></p>
                    <p>{detail.tanggal ? fmtTanggal(detail.tanggal) : "Belum ada tanggal"}</p>
                  </div>
                ) : (
                  <div className="text-xs text-gray-300 mb-3">Belum ada data</div>
                )}
                <Link
                  href={`/supervisor/${step.href}/${data.id}`}
                  className={`btn btn-sm w-full justify-center ${
                    st.active ? "btn-primary" : st.done ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {detail ? "Lihat Detail" : st.active ? "Isi Sekarang" : "Belum Tersedia"}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bukti tugas guru */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600" /> Bukti Tugas Guru
            </h3>
          </div>
          <div className="p-5 pt-0">
            <BuktiTugasPanel siklusId={data.id} bisaVerifikasi />
          </div>
        </div>

        {/* Foto dokumentasi supervisi (bukti otentik) */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" /> Foto Dokumentasi Supervisi
            </h3>
          </div>
          <div className="p-5 pt-0">
            <FotoDokumentasi siklusId={data.id} bisaKelola />
          </div>
        </div>

        {/* RTL list jika ada */}
        {data.pascaSupervisi?.rtl && data.pascaSupervisi.rtl.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="text-gray-800 font-bold text-sm">Rencana Tindak Lanjut (RTL)</h3>
            </div>
            <div className="p-5 space-y-3">
              {data.pascaSupervisi.rtl.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-gray-700">{r.aspek}</p>
                    <Badge variant={r.statusMonitoring === "SELESAI" ? "success" : r.statusMonitoring === "PROSES" ? "warning" : "default"}>
                      {r.statusMonitoring === "SELESAI" ? "Selesai" : r.statusMonitoring === "PROSES" ? "Dalam Proses" : "Belum"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{r.rencana}</p>
                  {r.target && <p className="text-xs text-gray-400 mt-1">Target: {r.target}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info guru + aksi */}
        <div className="card p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-xs">
              <p className="text-gray-700 font-medium">{data.guru.nama}</p>
              <p className="text-gray-400">{data.guru.email}{data.guru.nip ? ` · NIP ${data.guru.nip}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/supervisor/siklus/${data.id}/cetak`}
              className="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-60"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Hapus Siklus
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
