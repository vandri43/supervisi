"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { BadgeVariant } from "@/components/ui/Badge";
import { Plus, Search, Pencil, Trash2, Users, ShieldCheck, GraduationCap, BookOpen, Eye, EyeOff } from "lucide-react";

type Role = "ADMIN" | "SUPERVISOR" | "GURU";

const usersData = [
  { id: "1", nama: "Administrator", email: "admin@supervisi.id", role: "ADMIN" as Role, nip: "-", jabatan: "Administrator Sistem", sekolah: "-", mapel: "-", aktif: true },
  { id: "2", nama: "Drs. Budi Santoso, M.Pd", email: "supervisor@supervisi.id", role: "SUPERVISOR" as Role, nip: "196501011990031001", jabatan: "Pengawas Sekolah", sekolah: "SMKN 1 Contoh", mapel: "-", aktif: true },
  { id: "3", nama: "Siti Rahayu, S.Pd", email: "guru@supervisi.id", role: "GURU" as Role, nip: "198501012010012001", jabatan: "Guru Mapel", sekolah: "SMKN 1 Contoh", mapel: "DKV", aktif: true },
  { id: "4", nama: "Ahmad Fauzi, S.T", email: "ahmad@supervisi.id", role: "GURU" as Role, nip: "199001012015011001", jabatan: "Guru Mapel", sekolah: "SMKN 1 Contoh", mapel: "TKJ", aktif: true },
  { id: "5", nama: "Dewi Lestari, M.Pd", email: "dewi@supervisi.id", role: "GURU" as Role, nip: "198801012012012001", jabatan: "Guru Mapel", sekolah: "SMKN 2 Contoh", mapel: "B. Inggris", aktif: true },
  { id: "6", nama: "Hendra Wijaya, S.Pd", email: "hendra@supervisi.id", role: "SUPERVISOR" as Role, nip: "197001012000031001", jabatan: "Pengawas Sekolah", sekolah: "SMKN 2 Contoh", mapel: "-", aktif: false },
];

const roleConfig: Record<Role, { label: string; variant: BadgeVariant; icon: React.ElementType }> = {
  ADMIN:      { label: "Admin",      variant: "danger",   icon: ShieldCheck },
  SUPERVISOR: { label: "Supervisor", variant: "primary",  icon: GraduationCap },
  GURU:       { label: "Guru",       variant: "info",     icon: BookOpen },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "">("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<(typeof usersData)[0] | null>(null);
  const [showPass, setShowPass] = useState(false);

  const filtered = usersData.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.nip.includes(search);
    const matchRole = filterRole ? u.role === filterRole : true;
    return matchSearch && matchRole;
  });

  const counts = {
    total: usersData.length,
    admin: usersData.filter((u) => u.role === "ADMIN").length,
    supervisor: usersData.filter((u) => u.role === "SUPERVISOR").length,
    guru: usersData.filter((u) => u.role === "GURU").length,
  };

  return (
    <DashboardLayout
      pageTitle="Kelola Pengguna"
      breadcrumbs={[{ label: "Admin" }, { label: "Pengguna" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Pengguna", value: counts.total, color: "text-indigo-600 bg-indigo-50", icon: Users },
          { label: "Admin", value: counts.admin, color: "text-red-600 bg-red-50", icon: ShieldCheck },
          { label: "Supervisor", value: counts.supervisor, color: "text-purple-600 bg-purple-50", icon: GraduationCap },
          { label: "Guru", value: counts.guru, color: "text-blue-600 bg-blue-50", icon: BookOpen },
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
            <button
              onClick={() => { setEditData(null); setShowModal(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-argon">
            <thead>
              <tr>
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
              {filtered.map((u) => {
                const rc = roleConfig[u.role];
                const Icon = rc.icon;
                return (
                  <tr key={u.id}>
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
                          <p className="text-xs text-gray-400">{u.jabatan}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-gray-500">{u.email}</td>
                    <td>
                      <Badge variant={rc.variant as BadgeVariant}>
                        <Icon className="w-3 h-3 mr-1" />
                        {rc.label}
                      </Badge>
                    </td>
                    <td className="text-xs text-gray-400 font-mono">{u.nip}</td>
                    <td className="text-xs text-gray-500">{u.sekolah}</td>
                    <td className="text-xs text-gray-500">{u.mapel}</td>
                    <td>
                      <Badge variant={u.aktif ? "success" : "default"}>
                        {u.aktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditData(u); setShowModal(true); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    Tidak ada pengguna ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-gray-800 font-bold">
                {editData ? "Edit Pengguna" : "Tambah Pengguna"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-light">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Nama Lengkap</label>
                  <input className="form-input" defaultValue={editData?.nama} placeholder="Nama lengkap dengan gelar" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" defaultValue={editData?.email} placeholder="email@example.com" />
                </div>
                {!editData && (
                  <div className="col-span-2">
                    <label className="form-label">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        className="form-input pr-10"
                        placeholder="Minimal 8 karakter"
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
                )}
                <div>
                  <label className="form-label">Role</label>
                  <select className="form-select" defaultValue={editData?.role}>
                    <option value="GURU">Guru</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">NIP</label>
                  <input className="form-input" defaultValue={editData?.nip} placeholder="18 digit NIP" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Sekolah</label>
                  <select className="form-select">
                    <option value="">Pilih Sekolah</option>
                    <option>SMKN 1 Contoh</option>
                    <option>SMKN 2 Contoh</option>
                    <option>SMKN 3 Contoh</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Jabatan</label>
                  <input className="form-input" defaultValue={editData?.jabatan} placeholder="Jabatan" />
                </div>
                <div>
                  <label className="form-label">Mata Pelajaran</label>
                  <input className="form-input" defaultValue={editData?.mapel} placeholder="Khusus guru" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="btn bg-gray-100 text-gray-600 hover:bg-gray-200">Batal</button>
              <button className="btn-primary">
                {editData ? "Simpan Perubahan" : "Tambah Pengguna"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

