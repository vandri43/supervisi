"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import { Plus, Search, Pencil, Trash2, School, MapPin, Phone, Mail } from "lucide-react";

const sekolahData = [
  { id: "1", nama: "SMK Negeri 1 Contoh", npsn: "12345678", kabupaten: "Kab. Contoh", provinsi: "Jawa Tengah", telepon: "0281-123456", email: "smkn1@example.com", jumlahGuru: 24, jumlahSupervisor: 2, aktif: true },
  { id: "2", nama: "SMK Negeri 2 Contoh", npsn: "87654321", kabupaten: "Kab. Contoh", provinsi: "Jawa Tengah", telepon: "0281-654321", email: "smkn2@example.com", jumlahGuru: 20, jumlahSupervisor: 2, aktif: true },
  { id: "3", nama: "SMK Negeri 3 Contoh", npsn: "11223344", kabupaten: "Kab. Lain", provinsi: "Jawa Tengah", telepon: "0281-112233", email: "smkn3@example.com", jumlahGuru: 16, jumlahSupervisor: 1, aktif: true },
  { id: "4", nama: "SMK Swasta Harapan", npsn: "55667788", kabupaten: "Kota Contoh", provinsi: "Jawa Tengah", telepon: "0281-556677", email: "smk_harapan@example.com", jumlahGuru: 12, jumlahSupervisor: 1, aktif: false },
];

export default function SekolahPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<(typeof sekolahData)[0] | null>(null);

  const filtered = sekolahData.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.npsn.includes(search) ||
      s.kabupaten.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      pageTitle="Kelola Sekolah"
      breadcrumbs={[{ label: "Admin" }, { label: "Sekolah" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Sekolah", value: sekolahData.length, color: "text-indigo-600 bg-indigo-50" },
          { label: "Sekolah Aktif", value: sekolahData.filter(s => s.aktif).length, color: "text-green-600 bg-green-50" },
          { label: "Total Guru", value: sekolahData.reduce((a, s) => a + s.jumlahGuru, 0), color: "text-blue-600 bg-blue-50" },
          { label: "Total Supervisor", value: sekolahData.reduce((a, s) => a + s.jumlahSupervisor, 0), color: "text-orange-600 bg-orange-50" },
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
            <button
              onClick={() => { setEditData(null); setShowModal(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Tambah Sekolah
            </button>
          </div>
        </div>

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
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <School className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-medium text-gray-700 text-xs">{s.nama}</span>
                    </div>
                  </td>
                  <td className="text-gray-500 text-xs font-mono">{s.npsn}</td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {s.kabupaten}, {s.provinsi}
                    </div>
                  </td>
                  <td>
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Phone className="w-3 h-3" />{s.telepon}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Mail className="w-3 h-3" />{s.email}
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
                        onClick={() => { setEditData(s); setShowModal(true); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Tidak ada sekolah ditemukan
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-gray-800 font-bold">
                {editData ? "Edit Sekolah" : "Tambah Sekolah"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-light"
              >×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Nama Sekolah</label>
                  <input className="form-input" defaultValue={editData?.nama} placeholder="SMK Negeri ..." />
                </div>
                <div>
                  <label className="form-label">NPSN</label>
                  <input className="form-input" defaultValue={editData?.npsn} placeholder="8 digit NPSN" />
                </div>
                <div>
                  <label className="form-label">No. Telepon</label>
                  <input className="form-input" defaultValue={editData?.telepon} placeholder="0281-..." />
                </div>
                <div>
                  <label className="form-label">Kabupaten/Kota</label>
                  <input className="form-input" defaultValue={editData?.kabupaten} placeholder="Kab./Kota" />
                </div>
                <div>
                  <label className="form-label">Provinsi</label>
                  <input className="form-input" defaultValue={editData?.provinsi} placeholder="Provinsi" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Email</label>
                  <input className="form-input" defaultValue={editData?.email} placeholder="email@sekolah.sch.id" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Alamat Lengkap</label>
                  <textarea className="form-input" rows={2} placeholder="Jl. ..." />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn bg-gray-100 text-gray-600 hover:bg-gray-200"
              >Batal</button>
              <button className="btn-primary">
                {editData ? "Simpan Perubahan" : "Tambah Sekolah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

