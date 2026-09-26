"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import { Plus, Search, Pencil, Trash2, School, MapPin, Phone, Mail, Loader2 } from "lucide-react";

interface Sekolah {
  id: string;
  nama: string;
  npsn: string | null;
  alamat: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  telepon: string | null;
  email: string | null;
  aktif: boolean;
  jumlahGuru: number;
  jumlahSupervisor: number;
}

const emptyForm = {
  nama: "",
  npsn: "",
  telepon: "",
  kabupaten: "",
  provinsi: "",
  email: "",
  alamat: "",
};

export default function SekolahPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<Sekolah | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [list, setList] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSekolah = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sekolah");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data sekolah");
      setList(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data sekolah");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSekolah();
  }, [fetchSekolah]);

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (s: Sekolah) => {
    setEditData(s);
    setForm({
      nama: s.nama,
      npsn: s.npsn ?? "",
      telepon: s.telepon ?? "",
      kabupaten: s.kabupaten ?? "",
      provinsi: s.provinsi ?? "",
      email: s.email ?? "",
      alamat: s.alamat ?? "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(editData ? `/api/sekolah/${editData.id}` : "/api/sekolah", {
        method: editData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan sekolah");
      setShowModal(false);
      fetchSekolah();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan sekolah");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Sekolah) => {
    if (!confirm(`Hapus sekolah "${s.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(s.id);
    try {
      const res = await fetch(`/api/sekolah/${s.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus sekolah");
      fetchSekolah();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus sekolah");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = list.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nama.toLowerCase().includes(q) ||
      (s.npsn ?? "").includes(search) ||
      (s.kabupaten ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout
      pageTitle="Kelola Sekolah"
      breadcrumbs={[{ label: "Admin" }, { label: "Sekolah" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Sekolah", value: list.length, color: "text-indigo-600 bg-indigo-50" },
          { label: "Sekolah Aktif", value: list.filter((s) => s.aktif).length, color: "text-green-600 bg-green-50" },
          { label: "Total Guru", value: list.reduce((a, s) => a + s.jumlahGuru, 0), color: "text-blue-600 bg-blue-50" },
          { label: "Total Supervisor", value: list.reduce((a, s) => a + s.jumlahSupervisor, 0), color: "text-orange-600 bg-orange-50" },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.color}`}>
              <School className="w-5 h-5" />
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
          <h3 className="text-gray-800 font-bold text-sm">Daftar Sekolah</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari sekolah..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-40 text-gray-600 placeholder-gray-400"
              />
            </div>
            <button onClick={openAdd} className="btn-primary">
              <Plus className="w-4 h-4" />
              Tambah Sekolah
            </button>
          </div>
        </div>

        {error && !showModal && (
          <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table-argon">
            <thead>
              <tr>
                <th>Nama Sekolah</th>
                <th>NPSN</th>
                <th>Lokasi</th>
                <th>Kontak</th>
                <th>Pengguna</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    Memuat data sekolah...
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <School className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-700 text-xs">{s.nama}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 text-xs font-mono">{s.npsn ?? "-"}</td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {s.kabupaten || "-"}
                        {s.provinsi ? `, ${s.provinsi}` : ""}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="w-3 h-3" />{s.telepon ?? "-"}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Mail className="w-3 h-3" />{s.email ?? "-"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs">
                        <span className="text-gray-700 font-medium">{s.jumlahGuru}</span>
                        <span className="text-gray-400"> guru, </span>
                        <span className="text-gray-700 font-medium">{s.jumlahSupervisor}</span>
                        <span className="text-gray-400"> supervisor</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={s.aktif ? "success" : "default"}>
                        {s.aktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={deletingId === s.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Hapus"
                        >
                          {deletingId === s.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    {list.length === 0
                      ? "Belum ada sekolah. Klik \"Tambah Sekolah\" untuk menambahkan."
                      : "Tidak ada sekolah ditemukan"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-gray-800 font-bold">
                {editData ? "Edit Sekolah" : "Tambah Sekolah"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-light"
              >×</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Nama Sekolah *</label>
                  <input
                    className="form-input"
                    required
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="SMK Negeri ..."
                  />
                </div>
                <div>
                  <label className="form-label">NPSN</label>
                  <input
                    className="form-input"
                    inputMode="numeric"
                    maxLength={8}
                    value={form.npsn}
                    onChange={(e) => setForm({ ...form, npsn: e.target.value.replace(/\D/g, "") })}
                    placeholder="8 digit NPSN"
                  />
                </div>
                <div>
                  <label className="form-label">No. Telepon</label>
                  <input
                    className="form-input"
                    value={form.telepon}
                    onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                    placeholder="0281-..."
                  />
                </div>
                <div>
                  <label className="form-label">Kabupaten/Kota</label>
                  <input
                    className="form-input"
                    value={form.kabupaten}
                    onChange={(e) => setForm({ ...form, kabupaten: e.target.value })}
                    placeholder="Kab./Kota"
                  />
                </div>
                <div>
                  <label className="form-label">Provinsi</label>
                  <input
                    className="form-input"
                    value={form.provinsi}
                    onChange={(e) => setForm({ ...form, provinsi: e.target.value })}
                    placeholder="Provinsi"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@sekolah.sch.id"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Alamat Lengkap</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    placeholder="Jl. ..."
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-100 text-gray-600 hover:bg-gray-200">
                Batal
              </button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editData ? "Simpan Perubahan" : "Tambah Sekolah"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
