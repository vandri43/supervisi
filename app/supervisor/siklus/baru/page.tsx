"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const guruList = [
  { id: "1", nama: "Siti Rahayu, S.Pd", mapel: "DKV", sekolah: "SMKN 1 Contoh" },
  { id: "2", nama: "Ahmad Fauzi, S.T", mapel: "TKJ", sekolah: "SMKN 1 Contoh" },
  { id: "3", nama: "Dewi Lestari, M.Pd", mapel: "B. Inggris", sekolah: "SMKN 2 Contoh" },
  { id: "4", nama: "Budi Hartono, S.Pd", mapel: "Matematika", sekolah: "SMKN 1 Contoh" },
  { id: "5", nama: "Rina Marlina, S.Pd", mapel: "PJOK", sekolah: "SMKN 1 Contoh" },
];

export default function SiklusBaruPage() {
  const router = useRouter();
  const [selectedGuru, setSelectedGuru] = useState("");
  const [form, setForm] = useState({
    tahunAjaran: "2025/2026",
    semester: "GANJIL",
    kelas: "",
    mapel: "",
    topik: "",
    tanggalMulai: "",
    catatan: "",
  });

  const guru = guruList.find((g) => g.id === selectedGuru);

  function handleGuruChange(id: string) {
    setSelectedGuru(id);
    const g = guruList.find((g) => g.id === id);
    if (g) setForm((prev) => ({ ...prev, mapel: g.mapel }));
  }

  return (
    <DashboardLayout
      pageTitle="Buat Siklus Supervisi Baru"
      breadcrumbs={[
        { label: "Supervisor" },
        { label: "Siklus", href: "/supervisor/siklus" },
        { label: "Baru" },
      ]}
    >
      <div className="max-w-2xl mx-auto">
        <Link href="/supervisor/siklus" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke daftar siklus
        </Link>

        <div className="card">
          <div className="card-header">
            <h3 className="text-gray-800 font-bold">Informasi Siklus Supervisi</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Isi data di bawah untuk memulai siklus supervisi baru. Setelah disimpan, Anda dapat melanjutkan ke tahap Pra Observasi.
            </p>
          </div>
          <div className="card-body space-y-5">
            {/* Guru */}
            <div>
              <label className="form-label">Guru yang Disupervisi <span className="text-red-500">*</span></label>
              <select
                className="form-select"
                value={selectedGuru}
                onChange={(e) => handleGuruChange(e.target.value)}
                required
              >
                <option value="">— Pilih Guru —</option>
                {guruList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama} ({g.mapel} · {g.sekolah})
                  </option>
                ))}
              </select>
              {guru && (
                <p className="text-xs text-indigo-600 mt-1">
                  ✓ {guru.nama} · {guru.mapel} · {guru.sekolah}
                </p>
              )}
            </div>

            {/* Tahun ajaran + semester */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Tahun Ajaran <span className="text-red-500">*</span></label>
                <input
                  className="form-input"
                  value={form.tahunAjaran}
                  onChange={(e) => setForm({ ...form, tahunAjaran: e.target.value })}
                  placeholder="2025/2026"
                />
              </div>
              <div>
                <label className="form-label">Semester <span className="text-red-500">*</span></label>
                <select
                  className="form-select"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                >
                  <option value="GANJIL">Ganjil</option>
                  <option value="GENAP">Genap</option>
                </select>
              </div>
            </div>

            {/* Kelas + Mapel */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Kelas <span className="text-red-500">*</span></label>
                <input
                  className="form-input"
                  value={form.kelas}
                  onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                  placeholder="X-DKV-1"
                />
              </div>
              <div>
                <label className="form-label">Mata Pelajaran <span className="text-red-500">*</span></label>
                <input
                  className="form-input"
                  value={form.mapel}
                  onChange={(e) => setForm({ ...form, mapel: e.target.value })}
                  placeholder="Otomatis dari guru"
                />
              </div>
            </div>

            {/* Topik */}
            <div>
              <label className="form-label">Topik / Materi Pembelajaran</label>
              <input
                className="form-input"
                value={form.topik}
                onChange={(e) => setForm({ ...form, topik: e.target.value })}
                placeholder="Contoh: Desain Poster Digital dengan Adobe Photoshop"
              />
            </div>

            {/* Tanggal mulai */}
            <div>
              <label className="form-label">Tanggal Mulai</label>
              <input
                type="date"
                className="form-input"
                value={form.tanggalMulai}
                onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="form-label">Catatan Awal (Opsional)</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                placeholder="Catatan tambahan untuk siklus ini..."
              />
            </div>

            {/* Info siklus */}
            <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700">
              <p className="font-semibold mb-1">Alur Siklus Supervisi</p>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {["Pra Observasi (Telaah RPP/RPM)", "Observasi Kelas", "Pasca Supervisi (Refleksi & RTL)"].map((s, i, arr) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className="bg-indigo-200 text-indigo-700 rounded-full px-2 py-0.5">{i + 1}. {s}</span>
                    {i < arr.length - 1 && <span className="text-indigo-300">→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/supervisor/siklus" className="btn bg-gray-100 text-gray-600 hover:bg-gray-200">
              Batal
            </Link>
            <button
              onClick={() => router.push("/supervisor/siklus")}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              Simpan & Mulai Siklus
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

