"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { BadgeVariant } from "@/components/ui/Badge";
import { User, School, ShieldCheck, Mail, KeyRound, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff, Save } from "lucide-react";

interface ProfileData {
  id: string;
  nama: string;
  email: string;
  role: string;
  nip: string | null;
  jabatan: string | null;
  mapel: string | null;
  aktif: boolean;
  createdAt: string;
  sekolah: { id: string; nama: string; npsn: string | null } | null;
}

const roleConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  ADMIN: { label: "Admin", variant: "danger" },
  SUPERVISOR: { label: "Supervisor", variant: "primary" },
  GURU: { label: "Guru", variant: "info" },
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ nama: "", jabatan: "", mapel: "" });
  const [pass, setPass] = useState({ lama: "", baru: "", konfirmasi: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfil, setSavingProfil] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [msgProfil, setMsgProfil] = useState("");
  const [msgPass, setMsgPass] = useState("");
  const [errorProfil, setErrorProfil] = useState("");
  const [errorPass, setErrorPass] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat profil");
      setData(json);
      setForm({
        nama: json.nama ?? "",
        jabatan: json.jabatan ?? "",
        mapel: json.mapel ?? "",
      });
    } catch (e) {
      setErrorProfil(e instanceof Error ? e.message : "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const simpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfil(true);
    setMsgProfil("");
    setErrorProfil("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan profil");
      setMsgProfil("Profil berhasil diperbarui. Refresh halaman untuk melihat nama baru di navbar.");
      fetchProfile();
    } catch (e) {
      setErrorProfil(e instanceof Error ? e.message : "Gagal menyimpan profil");
    } finally {
      setSavingProfil(false);
    }
  };

  const gantiPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPass("");
    setMsgPass("");
    if (pass.baru !== pass.konfirmasi) {
      setErrorPass("Konfirmasi password tidak sama");
      return;
    }
    setSavingPass(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordLama: pass.lama, passwordBaru: pass.baru }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengganti password");
      setMsgPass("Password berhasil diganti.");
      setPass({ lama: "", baru: "", konfirmasi: "" });
    } catch (e) {
      setErrorPass(e instanceof Error ? e.message : "Gagal mengganti password");
    } finally {
      setSavingPass(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Profil Saya" breadcrumbs={[{ label: "Akun" }, { label: "Profil" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat profil...
        </div>
      </DashboardLayout>
    );
  }

  const rc = data ? roleConfig[data.role] ?? roleConfig.GURU : roleConfig.GURU;

  return (
    <DashboardLayout pageTitle="Profil Saya" breadcrumbs={[{ label: "Akun" }, { label: "Profil" }]}>
      <div className="max-w-3xl mx-auto">
        {/* Kartu profil */}
        <div className="card mb-6">
          <div className="card-body flex items-center gap-5 flex-wrap">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
            >
              {data?.nama?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-bold text-gray-800">{data?.nama}</h2>
                <Badge variant={rc.variant}>
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {rc.label}
                </Badge>
                {data?.aktif === false && <Badge variant="default">Nonaktif</Badge>}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {data?.email}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                <School className="w-3.5 h-3.5" />
                {data?.sekolah ? `${data.sekolah.nama}${data.sekolah.npsn ? ` (NPSN ${data.sekolah.npsn})` : ""}` : "Tanpa sekolah"}
              </p>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-gray-400 mb-0.5">NIP</p>
              <p className="text-gray-700 font-medium font-mono">{data?.nip ?? "-"}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">Jabatan</p>
              <p className="text-gray-700 font-medium">{data?.jabatan ?? "-"}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">Mata Pelajaran</p>
              <p className="text-gray-700 font-medium">{data?.mapel ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Edit profil */}
        <form onSubmit={simpanProfil} className="card mb-6">
          <div className="card-header flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-gray-800 font-bold text-sm">Edit Profil</h3>
              <p className="text-gray-400 text-xs">Perbarui data diri Anda</p>
            </div>
          </div>
          <div className="card-body space-y-4">
            {msgProfil && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {msgProfil}
              </div>
            )}
            {errorProfil && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorProfil}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Nama Lengkap</label>
                <input
                  className="form-input"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama lengkap dengan gelar"
                />
              </div>
              <div>
                <label className="form-label">Jabatan</label>
                <input
                  className="form-input"
                  value={form.jabatan}
                  onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                  placeholder="Jabatan"
                />
              </div>
              <div>
                <label className="form-label">Mata Pelajaran</label>
                <input
                  className="form-input"
                  value={form.mapel}
                  onChange={(e) => setForm({ ...form, mapel: e.target.value })}
                  placeholder="Khusus guru"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Email (tidak dapat diubah)</label>
                <input className="form-input bg-gray-50" value={data?.email ?? ""} disabled />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={savingProfil} className="btn-primary disabled:opacity-60">
              {savingProfil ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Profil
            </button>
          </div>
        </form>

        {/* Ganti password */}
        <form onSubmit={gantiPassword} className="card">
          <div className="card-header flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-orange-500" />
            <div>
              <h3 className="text-gray-800 font-bold text-sm">Ganti Password</h3>
              <p className="text-gray-400 text-xs">Password minimal 8 karakter</p>
            </div>
          </div>
          <div className="card-body space-y-4">
            {msgPass && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {msgPass}
              </div>
            )}
            {errorPass && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorPass}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Password Lama *</label>
                <input
                  type={showPass ? "text" : "password"}
                  className="form-input"
                  required
                  value={pass.lama}
                  onChange={(e) => setPass({ ...pass, lama: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Password Baru *</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="form-input pr-10"
                    required
                    minLength={8}
                    value={pass.baru}
                    onChange={(e) => setPass({ ...pass, baru: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Konfirmasi Baru *</label>
                <input
                  type={showPass ? "text" : "password"}
                  className="form-input"
                  required
                  minLength={8}
                  value={pass.konfirmasi}
                  onChange={(e) => setPass({ ...pass, konfirmasi: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={savingPass} className="btn-primary disabled:opacity-60">
              {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Ganti Password
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
