"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { statusBadge, predikatBadge } from "@/components/ui/Badge";
import { Plus, Search, ChevronRight, ClipboardList, CheckCircle, Clock, FileSearch } from "lucide-react";
import Link from "next/link";

const siklusData = [
  { id: "1", guru: "Siti Rahayu, S.Pd", mapel: "DKV", kelas: "X-DKV-1", tahunAjaran: "2025/2026", semester: "GANJIL", status: "SELESAI", predikat: "BAIK", nilai: 87.5, topik: "Desain Poster Digital", tanggal: "15 Sep 2025" },
  { id: "2", guru: "Ahmad Fauzi, S.T", mapel: "TKJ", kelas: "XI-TKJ-2", tahunAjaran: "2025/2026", semester: "GANJIL", status: "OBSERVASI", predikat: null, nilai: null, topik: "Konfigurasi Jaringan LAN", tanggal: "18 Sep 2025" },
  { id: "3", guru: "Dewi Lestari, M.Pd", mapel: "B. Inggris", kelas: "X-RPL-1", tahunAjaran: "2025/2026", semester: "GANJIL", status: "SELESAI", predikat: "SANGAT_BAIK", nilai: 91.0, topik: "Reading Comprehension", tanggal: "10 Sep 2025" },
  { id: "4", guru: "Budi Hartono, S.Pd", mapel: "Matematika", kelas: "XI-AKL-1", tahunAjaran: "2025/2026", semester: "GANJIL", status: "PASCA_SUPERVISI", predikat: null, nilai: null, topik: "Statistika Deskriptif", tanggal: "20 Sep 2025" },
  { id: "5", guru: "Rina Marlina, S.Pd", mapel: "PJOK", kelas: "XII-PJOK-1", tahunAjaran: "2025/2026", semester: "GANJIL", status: "PRA_OBSERVASI", predikat: null, nilai: null, topik: "Permainan Bola Voli", tanggal: "22 Sep 2025" },
  { id: "6", guru: "Hasan Kuswandi, S.Pd", mapel: "Multimedia", kelas: "XII-MM-1", tahunAjaran: "2025/2026", semester: "GANJIL", status: "DRAFT", predikat: null, nilai: null, topik: "Animasi 2D dengan Adobe Animate", tanggal: "23 Sep 2025" },
];

// Step progress untuk setiap status
const statusStep: Record<string, number> = {
  DRAFT: 0,
  PRA_OBSERVASI: 1,
  OBSERVASI: 2,
  PASCA_SUPERVISI: 3,
  SELESAI: 4,
};

const steps = ["Draft", "Pra Obs.", "Observasi", "Pasca", "Selesai"];

export default function SiklusPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = siklusData.filter((s) => {
    const matchSearch =
      s.guru.toLowerCase().includes(search.toLowerCase()) ||
      s.mapel.toLowerCase().includes(search.toLowerCase()) ||
      s.kelas.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? s.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: "Total Siklus", value: siklusData.length, icon: ClipboardList, color: "text-indigo-600 bg-indigo-50" },
    { label: "Sedang Berjalan", value: siklusData.filter(s => !["SELESAI", "DRAFT"].includes(s.status)).length, icon: Clock, color: "text-orange-600 bg-orange-50" },
    { label: "Selesai", value: siklusData.filter(s => s.status === "SELESAI").length, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Draft", value: siklusData.filter(s => s.status === "DRAFT").length, icon: FileSearch, color: "text-gray-600 bg-gray-100" },
  ];

  return (
    <DashboardLayout
      pageTitle="Siklus Supervisi"
      breadcrumbs={[{ label: "Supervisor" }, { label: "Siklus Supervisi" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-gray-800 font-bold text-sm">Daftar Siklus Supervisi</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select text-sm py-2 w-40"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PRA_OBSERVASI">Pra Observasi</option>
              <option value="OBSERVASI">Observasi</option>
              <option value="PASCA_SUPERVISI">Pasca Supervisi</option>
              <option value="SELESAI">Selesai</option>
            </select>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari guru / kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-36 text-gray-600 placeholder-gray-400"
              />
            </div>
            <Link href="/supervisor/siklus/baru" className="btn-primary">
              <Plus className="w-4 h-4" />
              Siklus Baru
            </Link>
          </div>
        </div>

        {/* Cards view */}
        <div className="p-5 grid grid-cols-1 gap-4">
          {filtered.map((s) => {
            const sb = statusBadge(s.status);
            const pb = s.predikat ? predikatBadge(s.predikat) : null;
            const currentStep = statusStep[s.status] ?? 0;

            return (
              <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-gray-800 font-semibold text-sm">{s.guru}</h4>
                      <Badge variant={sb.variant as "success" | "warning" | "danger" | "info" | "primary" | "default"}>{sb.label}</Badge>
                      {pb && <Badge variant={pb.variant as "success" | "warning" | "danger" | "info" | "primary" | "default"}>{pb.label}</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {s.mapel} · {s.kelas} · {s.tahunAjaran} Semester {s.semester === "GANJIL" ? "Ganjil" : "Genap"}
                    </p>
                    <p className="text-xs text-gray-400 italic">&quot;{s.topik}&quot;</p>
                  </div>

                  {/* Right: nilai + aksi */}
                  <div className="text-right flex-shrink-0">
                    {s.nilai ? (
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{s.nilai.toFixed(1)}</p>
                        <p className="text-xs text-gray-400">Nilai Akhir</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">{s.tanggal}</p>
                    )}
                  </div>
                </div>

                {/* Step progress */}
                <div className="mt-4">
                  <div className="flex items-center gap-0">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                            idx < currentStep
                              ? "bg-indigo-500 border-indigo-500 text-white"
                              : idx === currentStep
                              ? "bg-white border-indigo-500 text-indigo-500"
                              : "bg-white border-gray-200 text-gray-300"
                          }`}>
                            {idx < currentStep ? "✓" : idx + 1}
                          </div>
                          <span className={`text-xs mt-1 whitespace-nowrap ${
                            idx <= currentStep ? "text-indigo-600 font-medium" : "text-gray-300"
                          }`}>
                            {step}
                          </span>
                        </div>
                        {idx < steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${
                            idx < currentStep ? "bg-indigo-500" : "bg-gray-100"
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex items-center justify-end gap-2">
                  {s.status === "DRAFT" && (
                    <Link href={`/supervisor/pra-observasi/${s.id}`} className="btn-primary btn-sm">
                      Mulai Pra Observasi
                    </Link>
                  )}
                  {s.status === "PRA_OBSERVASI" && (
                    <Link href={`/supervisor/pra-observasi/${s.id}`} className="btn-warning btn-sm">
                      Lanjut Pra Observasi
                    </Link>
                  )}
                  {s.status === "OBSERVASI" && (
                    <Link href={`/supervisor/observasi/${s.id}`} className="btn-info btn-sm">
                      Lanjut Observasi
                    </Link>
                  )}
                  {s.status === "PASCA_SUPERVISI" && (
                    <Link href={`/supervisor/pasca/${s.id}`} className="btn-success btn-sm">
                      Lanjut Pasca Supervisi
                    </Link>
                  )}
                  <Link href={`/supervisor/siklus/${s.id}`} className="btn bg-gray-100 text-gray-600 btn-sm hover:bg-gray-200">
                    <span>Detail</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Tidak ada siklus ditemukan</p>
              <Link href="/supervisor/siklus/baru" className="btn-primary mt-4 inline-flex">
                <Plus className="w-4 h-4" />
                Buat Siklus Baru
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

