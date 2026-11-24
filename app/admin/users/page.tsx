"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { BadgeVariant } from "@/components/ui/Badge";
import {
  Plus, Search, Pencil, Trash2, Users, ShieldCheck, GraduationCap, BookOpen,
  Eye, EyeOff, Loader2, Upload, Download, FileSpreadsheet, KeyRound,
} from "lucide-react";

type Role = "ADMIN" | "SUPERVISOR" | "GURU";

interface UserRow {
  id: string;
  nama: string;
  email: string;
  role: Role;
  nip: string | null;
  mapel: string | null;
  jabatan: string | null;
  aktif: boolean;
  sekolahId: string | null;
  sekolahNama: string | null;
}

interface SekolahOption {
  id: string;
  nama: string;
  npsn: string | null;
}

const emptyForm = {
  nama: "",
  email: "",
  password: "",
  role: "GURU" as Role,
  nip: "",
  jabatan: "",
  mapel: "",
  sekolahId: "",
  aktif: true,
};

const roleConfig: Record<Role, { label: string; variant: BadgeVariant; icon: React.ElementType }> = {
  ADMIN:      { label: "Admin",      variant: "danger",  icon: ShieldCheck },
  SUPERVISOR: { label: "Supervisor", variant: "primary", icon: GraduationCap },
  GURU:       { label: "Guru",       variant: "info",    icon: BookOpen },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "">("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [list, setList] = useState<UserRow[]>([]);
  const [sekolahList, setSekolahList] = useState<SekolahOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Seleksi massal
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk password modal
  const [showBulkPassModal, setShowBulkPassModal] = useState(false);
  const [bulkPassword, setBulkPassword] = useState("");
  const [showBulkPass, setShowBulkPass] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  // Import Excel
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data pengguna");
      setList(json);
      // Reset seleksi saat data di-refresh
      setSelectedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSekolah = useCallback(async () => {
    try {
      const res = await fetch("/api/sekolah");
      const json = await res.json();
      if (res.ok) setSekolahList(json);
    } catch {
      // dropdown sekolah tetap bisa dipakai tanpa daftar
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchSekolah();
  }, [fetchUsers, fetchSekolah]);

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (u: UserRow) => {
    setEditData(u);
    setForm({
      nama: u.nama,
      email: u.email,
      password: "",
      role: u.role,
      nip: u.nip ?? "",
      jabatan: u.jabatan ?? "",
      mapel: u.mapel ?? "",
      sekolahId: u.sekolahId ?? "",
      aktif: u.aktif,
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(editData ? `/api/users/${editData.id}` : "/api/users", {
        method: editData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan pengguna");
      setShowModal(false);
      fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan pengguna");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (!confirm(`Hapus pengguna "${u.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus pengguna");
      fetchUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus pengguna");
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Excel ----
  const downloadExcel = (mode: "template" | "export") => {
    window.open(`/api/users/excel?mode=${mode}`, "_blank");
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/users/excel", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok && !json.summary) throw new Error(json.error || "Import gagal");
      setImportResult(
        `${json.summary}${json.errors?.length ? "\n" + json.errors.join("\n") : ""}`
      );
      fetchUsers();
    } catch (e) {
      setImportResult(e instanceof Error ? e.message : "Import gagal");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ---- Seleksi massal ----
  const filtered = list.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.nama.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.nip ?? "").includes(search);
    const matchRole = filterRole ? u.role === filterRole : true;
    return matchSearch && matchRole;
  });

  const filteredIds = filtered.map((u) => u.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected =
    !allFilteredSelected && filteredIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect semua yang terfilter
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select semua yang terfilter
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ---- Bulk Password ----
  const openBulkPass = () => {
    setBulkPassword("");
    setBulkError("");
    setBulkResult(null);
    setShowBulkPass(false);
    setShowBulkPassModal(true);
  };

  const handleBulkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSaving(true);
    setBulkError("");
    setBulkResult(null);
    try {
      const res = await fetch("/api/users/bulk-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          password: bulkPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui password");
      setBulkResult(`Password berhasil diubah untuk ${json.updated} pengguna.`);
      setSelectedIds(new Set());
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Gagal memperbarui password");
    } finally {
      setBulkSaving(false);
    }
  };

  const counts = {
    total: list.length,
    admin: list.filter((u) => u.role === "ADMIN").length,
    supervisor: list.filter((u) => u.role === "SUPERVISOR").length,
    guru: list.filter((u) => u.role === "GURU").length,
  };

  return (
    <DashboardLayout
      pageTitle="Kelola Pengguna"
      breadcrumbs={[{ label: "Admin" }, { label: "Pengguna" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Pengguna", value: counts.total,      color: "text-indigo-600 bg-indigo-50", icon: Users },
          { label: "Admin",          value: counts.admin,      color: "text-red-600 bg-red-50",       icon: ShieldCheck },
          { label: "Supervisor",     value: counts.supervisor, color: "text-purple-600 bg-purple-50", icon: GraduationCap },
          { label: "Guru",           value: counts.guru,       color: "text-blue-600 bg-blue-50",     icon: BookOpen },
        ].map((s, i) => (
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

      {/* Table Card */}
      <div className="card">
        <div className="card-header flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-gray-800 font-bold text-sm">Daftar Pengguna</h3>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Role */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as Role | "")}
              className="form-select text-sm py-2 w-36"
            >
              <option value="">Semua Role</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="GURU">Guru</option>
            </select>
            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama / email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-40 text-gray-600 placeholder-gray-400"
              />
            </div>
            {/* Import / Export Excel */}
            <button
              onClick={() => downloadExcel("template")}
              className="btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              title="Unduh template Excel untuk import"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Template
            </button>
            <label
              className="btn bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 cursor-pointer"
              title="Import pengguna dari file Excel"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? "Mengimpor..." : "Import"}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xlsm"
                className="hidden"
                disabled={importing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                }}
              />
            </label>
            <button
              onClick={() => downloadExcel("export")}
              className="btn bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              title="Unduh semua data pengguna (.xlsx)"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button onClick={openAdd} className="btn-primary">
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </button>
          </div>
        </div>

        {/* Bulk action bar — muncul saat ada yang diseleksi */}
        {selectedIds.size > 0 && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-medium text-indigo-700">
              {selectedIds.size} pengguna dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={openBulkPass}
                className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Ubah Password
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="btn bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 text-xs"
              >
                Batalkan Seleksi
              </button>
            </div>
          </div>
        )}

        {importResult && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs whitespace-pre-line flex items-start justify-between gap-3">
            <span>{importResult}</span>
            <button onClick={() => setImportResult(null)} className="text-indigo-400 hover:text-indigo-600 font-bold">✕</button>
          </div>
        )}

        {error && !showModal && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table-argon">
            <thead>
              <tr>
                {/* Kolom checkbox */}
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    onChange={toggleSelectAll}
                    title="Pilih semua"
                    disabled={filtered.length === 0}
                  />
                </th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>NIP</th>
                <th>Sekolah</th>
                <th>Mapel</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    Memuat data pengguna...
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((u) => {
                  const rc = roleConfig[u.role];
                  const Icon = rc.icon;
                  const isSelected = selectedIds.has(u.id);
                  return (
                    <tr
                      key={u.id}
                      className={isSelected ? "bg-indigo-50/60" : undefined}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelect(u.id)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
                          >
                            {u.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">{u.nama}</p>
                            <p className="text-xs text-gray-400">{u.jabatan ?? "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">{u.email}</td>
                      <td>
                        <Badge variant={rc.variant}>
                          <Icon className="w-3 h-3 mr-1" />
                          {rc.label}
                        </Badge>
                      </td>
                      <td className="text-xs text-gray-400 font-mono">{u.nip ?? "-"}</td>
                      <td className="text-xs text-gray-500">{u.sekolahNama ?? "-"}</td>
                      <td className="text-xs text-gray-500">{u.mapel ?? "-"}</td>
                      <td>
                        <Badge variant={u.aktif ? "success" : "default"}>
                          {u.aktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={deletingId === u.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-50"
                            title="Hapus"
                          >
                            {deletingId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    {list.length === 0
                      ? "Belum ada pengguna. Klik \"Tambah Pengguna\" atau import dari Excel."
                      : "Tidak ada pengguna ditemukan"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengguna */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-gray-800 font-bold">
                {editData ? "Edit Pengguna" : "Tambah Pengguna"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-light">×</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Nama Lengkap *</label>
                  <input
                    className="form-input"
                    required
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="Nama lengkap dengan gelar"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">
                    Password {editData ? "(kosongkan jika tidak diubah)" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      className="form-input pr-10"
                      required={!editData}
                      minLength={editData ? 0 : 8}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editData ? "Biarkan kosong = tidak diubah" : "Minimal 8 karakter"}
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
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  >
                    <option value="GURU">Guru</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">NIP</label>
                  <input
                    className="form-input"
                    value={form.nip}
                    onChange={(e) => setForm({ ...form, nip: e.target.value })}
                    placeholder="18 digit NIP"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Sekolah</label>
                  <select
                    className="form-select"
                    value={form.sekolahId}
                    onChange={(e) => setForm({ ...form, sekolahId: e.target.value })}
                  >
                    <option value="">Tanpa Sekolah</option>
                    {sekolahList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}{s.npsn ? ` (${s.npsn})` : ""}
                      </option>
                    ))}
                  </select>
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
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    id="aktif"
                    type="checkbox"
                    checked={form.aktif}
                    onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <label htmlFor="aktif" className="text-xs text-gray-600">Akun aktif (bisa login)</label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-100 text-gray-600 hover:bg-gray-200">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editData ? "Simpan Perubahan" : "Tambah Pengguna"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Ubah Password Massal */}
      {showBulkPassModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <form
            onSubmit={handleBulkPassword}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <h3 className="text-gray-800 font-bold">Ubah Password Massal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkPassModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-light"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info pengguna terpilih */}
              <div className="px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs">
                Password akan diubah untuk <strong>{selectedIds.size} pengguna</strong> yang dipilih.
              </div>

              {bulkError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  {bulkError}
                </div>
              )}

              {bulkResult && (
                <div className="px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
                  {bulkResult}
                </div>
              )}

              {!bulkResult && (
                <div>
                  <label className="form-label">Password Baru *</label>
                  <div className="relative">
                    <input
                      type={showBulkPass ? "text" : "password"}
                      className="form-input pr-10"
                      required
                      minLength={8}
                      value={bulkPassword}
                      onChange={(e) => setBulkPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowBulkPass(!showBulkPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showBulkPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Semua pengguna yang dipilih akan mendapat password yang sama.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkPassModal(false)}
                className="btn bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {bulkResult ? "Tutup" : "Batal"}
              </button>
              {!bulkResult && (
                <button
                  type="submit"
                  disabled={bulkSaving}
                  className="btn-primary disabled:opacity-60"
                >
                  {bulkSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ubah Password
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
