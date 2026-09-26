"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Save, ArrowLeft, Loader2, AlertTriangle, CalendarClock } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/lib/useSettings";

interface GuruOption {
  id: string;
  nama: string;
  mapel: string | null;
  nip: string | null;
  sekolahId: string | null;
  sekolahNama: string | null;
}

const currentTA = "2025/2026";

export default function SiklusBaruPage() {
  const router = useRouter();
  const [guruList, setGuruList] = useState<GuruOption[]>([]);
  const [selectedGuru, setSelectedGuru] = useState("");
  const [form, setForm] = useState({
    tahunAjaran: currentTA,
    semester: "GANJIL",
    kelas: "",
    mapel: "",
    topikPembelajaran: "",
    tanggalMulai: "",
    catatan: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { settings } = useSettings();

  const fetchGuru = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (res.ok) {
        setGuruList(json.filter((u: { role: string }) => u.role === "GURU"));
      }
    } catch {
      // dropdown tetap tampil kosong
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuru();
  }, [fetchGuru]);

  // Sinkronkan form dengan tahun ajaran aktif dari pengaturan
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      tahunAjaran: settings.tahunAjaran,
      semester: settings.semester,
    }));
  }, [settings.tahunAjaran, settings.semester]);

  const guru = guruList.find((g) => g.id === selectedGuru);

  function handleGuruChange(id: string) {
    setSelectedGuru(id);
    const g = guruList.find((x) => x.id === id);
    if (g?.mapel) setForm((prev) => ({ ...prev, mapel: g.mapel as string }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/siklus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guruId: selectedGuru }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan siklus");
      router.push(`/supervisor/siklus/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan siklus");
      setSaving(false);
    }
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

        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-header">
              <h3 className="text-gray-800 font-bold">Informasi Siklus Supervisi</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                Isi data di bawah untuk memulai siklus supervisi baru. Setelah disimpan, Anda dapat melanjutkan ke tahap Pra Observasi.
              </p>
            </div>
            <div className="card-body space-y-5">
              {error && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Guru */}
              <div>
                <label className="form-label">Guru yang Disupervisi <span className="text-red-500">*</span></label>
                <select
                  className="form-select"
                  value={selectedGuru}
                  onChange={(e) => handleGuruChange(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">
                    {loading ? "Memuat daftar guru..." : "— Pilih Guru —"}
                  </option>
                  {guruList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama}{g.mapel ? ` (${g.mapel})` : ""}{g.sekolahNama ? ` · ${g.sekolahNama}` : ""}
                    </option>
                  ))}
                </select>
                {guru && (
                  <p className="text-xs text-indigo-600 mt-1">
                    ✓ {guru.nama} · {guru.mapel ?? "-"} · {guru.sekolahNama ?? "Tanpa sekolah"}
                  </p>
                )}
                {!loading && guruList.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    Belum ada data guru. Tambahkan pengguna ber-role Guru di menu Kelola Pengguna terlebih dahulu.
                  </p>
                )}
              </div>

              {/* Tahun ajaran + semester (mengikuti pengaturan) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                    Tahun Ajaran (Pengaturan)
                  </label>
                  <input className="form-input bg-gray-50" value={form.tahunAjaran} disabled />
                </div>
                <div>
                  <label className="form-label">Semester (Pengaturan)</label>
                  <input
                    className="form-input bg-gray-50"
                    value={form.semester === "GANJIL" ? "Ganjil" : "Genap"}
                    disabled
                  />
                </div>
                <p className="col-span-2 text-xs text-gray-400 -mt-2">
                  Tahun ajaran mengikuti pengaturan aktif di menu Pengaturan (Admin). Ganti di sana untuk memulai tahun ajaran baru.
                </p>
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
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Mata Pelajaran</label>
                  <input
                    className="form-input"
                    value={form.mapel}
                    onChange={(e) => setForm({ ...form, mapel: e.target.value })}
                    placeholder="Otomatis dari data guru"
                  />
                </div>
              </div>

              {/* Topik */}
              <div>
                <label className="form-label">Topik / Materi Pembelajaran</label>
                <input
                  className="form-input"
                  value={form.topikPembelajaran}
                  onChange={(e) => setForm({ ...form, topikPembelajaran: e.target.value })}
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
              <button type="submit" disabled={saving || loading} className="btn-primary disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Menyimpan..." : "Simpan & Mulai Siklus"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
