"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon, Save, Building, Tag, ImageIcon, FileText, CheckCircle2, RotateCcw, CalendarClock, AlertTriangle, Plus } from "lucide-react";

interface SettingsForm {
  appName: string;
  appTagline: string;
  logoUrl: string;
  footerText: string;
  tahunAjaran: string;
  semester: string;
}

const DEFAULTS: SettingsForm = {
  appName: "Supervisi Guru",
  appTagline: "Sistem Supervisi Pembelajaran Mendalam",
  logoUrl: "",
  footerText: "",
  tahunAjaran: "2025/2026",
  semester: "GANJIL",
};

function opsiTahunAjaran(): string[] {
  const now = new Date().getFullYear();
  const list: string[] = [];
  for (let y = now - 3; y <= now + 2; y++) {
    list.push(`${y}/${y + 1}`);
  }
  return list;
}

// Tambah tahun manual ke daftar opsi (hindari duplikat, urut naik)
function tambahKeOpsi(opsi: string[], ta: string): string[] {
  if (!opsi.includes(ta)) {
    return [...opsi, ta].sort();
  }
  return opsi;
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [opsiTA, setOpsiTA] = useState<string[]>(opsiTahunAjaran());
  const [taManual, setTaManual] = useState("");
  const [taManualError, setTaManualError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          appName: data.appName ?? DEFAULTS.appName,
          appTagline: data.appTagline ?? DEFAULTS.appTagline,
          logoUrl: data.logoUrl ?? "",
          footerText: data.footerText ?? "",
          tahunAjaran: data.tahunAjaran ?? DEFAULTS.tahunAjaran,
          semester: data.semester ?? DEFAULTS.semester,
        });
        // Pastikan tahun yang sedang aktif selalu ada di daftar opsi
        setOpsiTA((prev) => tambahKeOpsi(prev, data.tahunAjaran ?? DEFAULTS.tahunAjaran));
      })
      .finally(() => setLoading(false));
  }, []);

  function tambahTahunManual() {
    const ta = taManual.trim();
    if (!/^\d{4}\/\d{4}$/.test(ta)) {
      setTaManualError("Format harus 2030/2031");
      return;
    }
    const [a, b] = ta.split("/").map(Number);
    if (b !== a + 1) {
      setTaManualError("Tahun kedua harus tahun pertama + 1");
      return;
    }
    setTaManualError("");
    setOpsiTA((prev) => tambahKeOpsi(prev, ta));
    setForm((prev) => ({ ...prev, tahunAjaran: ta }));
    setTaManual("");
  }

  function update<K extends keyof SettingsForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Gagal menyimpan pengaturan" });
      return;
    }

    setForm({
      appName: data.appName ?? form.appName,
      appTagline: data.appTagline ?? form.appTagline,
      logoUrl: data.logoUrl ?? "",
      footerText: data.footerText ?? "",
      tahunAjaran: data.tahunAjaran ?? form.tahunAjaran,
      semester: data.semester ?? form.semester,
    });
    setMessage({
      type: "success",
      text: `Tersimpan. Aplikasi kini aktif pada T.A ${data.tahunAjaran ?? form.tahunAjaran} Semester ${
        (data.semester ?? form.semester) === "GANJIL" ? "Ganjil" : "Genap"
      }. Perubahan tampil setelah halaman dimuat ulang.`,
    });
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Pengaturan" breadcrumbs={[{ label: "Admin" }, { label: "Pengaturan" }]}>
        <div className="card p-12 text-center text-gray-400 text-sm">Memuat pengaturan...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Pengaturan" breadcrumbs={[{ label: "Admin" }, { label: "Pengaturan" }]}>
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSave}>
          {/* Branding */}
          <div className="card mb-5">
            <div className="card-header flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-indigo-500" />
              <div>
                <h3 className="text-gray-800 font-bold text-sm">Branding Aplikasi</h3>
                <p className="text-gray-400 text-xs">Tampil di halaman login, sidebar, dan topbar</p>
              </div>
            </div>
            <div className="card-body space-y-5">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  Nama Aplikasi
                </label>
                <input
                  className="form-input"
                  value={form.appName}
                  onChange={(e) => update("appName", e.target.value)}
                  placeholder="Supervisi Guru"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  Tagline / Deskripsi Singkat
                </label>
                <input
                  className="form-input"
                  value={form.appTagline}
                  onChange={(e) => update("appTagline", e.target.value)}
                  placeholder="Sistem Supervisi Pembelajaran Mendalam"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                  URL Logo (opsional)
                </label>
                <input
                  className="form-input"
                  value={form.logoUrl}
                  onChange={(e) => update("logoUrl", e.target.value)}
                  placeholder="https://contoh.com/logo.png — kosongkan untuk ikon default"
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Tempel URL gambar logo. Disarankan gambar persegi (mis. 128×128 px).
                </p>
                {/* Preview logo */}
                <div className="mt-3 flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400 w-16 flex-shrink-0">Preview:</div>
                  {form.logoUrl.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logoUrl}
                      alt="Preview logo"
                      className="w-12 h-12 rounded-xl object-cover shadow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
                    >
                      <SettingsIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{form.appName || "Nama Aplikasi"}</p>
                    <p className="text-xs text-gray-400 truncate">{form.appTagline || "Tagline"}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  Teks Footer (opsional)
                </label>
                <input
                  className="form-input"
                  value={form.footerText}
                  onChange={(e) => update("footerText", e.target.value)}
                  placeholder="© 2026 Sistem Supervisi Guru"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Kosongkan untuk memakai default: nama aplikasi otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Tahun Ajaran Aktif */}
          <div className="card mb-5">
            <div className="card-header flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-indigo-500" />
              <div>
                <h3 className="text-gray-800 font-bold text-sm">Tahun Ajaran Aktif</h3>
                <p className="text-gray-400 text-xs">
                  Siklus, hasil, dan laporan hanya menampilkan data pada tahun ajaran & semester ini.
                </p>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Tahun Ajaran</label>
                  <select
                    className="form-select"
                    value={form.tahunAjaran}
                    onChange={(e) => update("tahunAjaran", e.target.value)}
                  >
                    {opsiTA.map((ta) => (
                      <option key={ta} value={ta}>{ta}</option>
                    ))}
                  </select>
                  {/* Tambah tahun manual */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      className="form-input text-sm flex-1"
                      placeholder="Tahun lain, mis. 2030/2031"
                      value={taManual}
                      onChange={(e) => {
                        setTaManual(e.target.value);
                        setTaManualError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          tambahTahunManual();
                        }
                      }}
                      maxLength={9}
                    />
                    <button
                      type="button"
                      onClick={tambahTahunManual}
                      className="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-sm whitespace-nowrap"
                      title="Tambahkan tahun ke daftar dan pilih"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  </div>
                  {taManualError && (
                    <p className="text-xs text-red-500 mt-1">{taManualError}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Daftar otomatis berisi ±5 tahun terdekat. Ketik tahun lain (mis. 2030/2031) lalu klik Tambah untuk menambahkannya.
                  </p>
                </div>
                <div>
                  <label className="form-label">Semester</label>
                  <select
                    className="form-select"
                    value={form.semester}
                    onChange={(e) => update("semester", e.target.value)}
                  >
                    <option value="GANJIL">Ganjil</option>
                    <option value="GENAP">Genap</option>
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Catatan pergantian tahun ajaran</p>
                  Data tahun lalu TIDAK terhapus — tetap tersimpan dan bisa dilihat lewat filter tahun ajaran
                  di halaman Laporan. Namun setelah tahun ajaran aktif diganti, seluruh menu (siklus, pra/observasi,
                  pasca, hasil guru, dan dashboard) otomatis hanya menampilkan data tahun ajaran yang baru —
                  dimulai dari 0 lagi.
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-lg px-4 py-3 mb-5 text-sm flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}
            >
              {message.type === "success" && <CheckCircle2 className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mb-6">
            <button
              type="button"
              className="btn bg-gray-100 text-gray-600 hover:bg-gray-200"
              onClick={() => setMessage(null)}
              disabled={saving}
            >
              <RotateCcw className="w-4 h-4" />
              Tutup Notifikasi
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
