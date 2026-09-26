"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import { Target, CheckCircle, Clock, AlertCircle, Calendar, ChevronDown, ChevronUp, Loader2, Inbox, CheckCircle2 } from "lucide-react";

type RTLStatus = "SELESAI" | "PROSES" | "BELUM";

interface RTLRow {
  id: string;
  siklusId: string;
  namaGuru?: string;
  topikSiklus: string;
  tahunAjaran: string;
  semester: string;
  aspek: string;
  temuan: string;
  rencana: string;
  target: string | null;
  deadline: string | null;
  status: RTLStatus;
  hasilMonitoring: string | null;
}

const statusConfig: Record<RTLStatus, { variant: "success" | "warning" | "info"; label: string; icon: React.ElementType; bg: string }> = {
  SELESAI: { variant: "success", label: "Selesai",      icon: CheckCircle,  bg: "bg-green-50 border-green-200 text-green-600" },
  PROSES:  { variant: "warning", label: "Dalam Proses", icon: Clock,        bg: "bg-orange-50 border-orange-200 text-orange-600" },
  BELUM:   { variant: "info",    label: "Belum Mulai",  icon: AlertCircle,  bg: "bg-blue-50 border-blue-200 text-blue-600" },
};

const fmtTanggal = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function RTLPage() {
  const [list, setList] = useState<RTLRow[]>([]);
  const [expanded, setExpanded] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<RTLStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressNotes, setProgressNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const fetchRTL = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guru/rtl");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat RTL");
      setList(json);
      if (json.length > 0) setExpanded(json[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat RTL");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRTL();
  }, [fetchRTL]);

  const simpanProgres = async (r: RTLRow) => {
    const catatan = progressNotes[r.id] ?? "";
    setSavingId(r.id);
    setError("");
    try {
      const res = await fetch("/api/guru/rtl", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, hasilMonitoring: catatan, status: catatan ? "PROSES" : r.status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan progres");
      setSavedIds((prev) => [...prev, r.id]);
      fetchRTL();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan progres");
    } finally {
      setSavingId(null);
    }
  };

  const counts = {
    total: list.length,
    selesai: list.filter((r) => r.status === "SELESAI").length,
    proses: list.filter((r) => r.status === "PROSES").length,
    belum: list.filter((r) => r.status === "BELUM").length,
  };

  const filtered = list.filter((r) => (filterStatus ? r.status === filterStatus : true));

  return (
    <DashboardLayout
      pageTitle="Rencana Tindak Lanjut"
      breadcrumbs={[{ label: "Guru" }, { label: "Rencana Tindak Lanjut" }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total RTL", value: counts.total, icon: Target, color: "text-indigo-600 bg-indigo-50" },
          { label: "Selesai", value: counts.selesai, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "Dalam Proses", value: counts.proses, icon: Clock, color: "text-orange-600 bg-orange-50" },
          { label: "Belum Mulai", value: counts.belum, icon: AlertCircle, color: "text-blue-600 bg-blue-50" },
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

      {/* Filter + List */}
      <div className="card">
        <div className="card-header flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-gray-800 font-bold text-sm">Daftar RTL</h3>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RTLStatus | "")}
              className="form-select text-sm py-2 w-40"
            >
              <option value="">Semua Status</option>
              <option value="BELUM">Belum Mulai</option>
              <option value="PROSES">Dalam Proses</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" /> Memuat RTL...
          </div>
        )}

        {!loading && (
          <div className="divide-y divide-gray-100">
            {filtered.map((r) => {
              const isOpen = expanded === r.id;
              const sc = statusConfig[r.status] ?? statusConfig.BELUM;
              const Icon = sc.icon;
              const sudahAdaHasil = !!r.hasilMonitoring;

              return (
                <div key={r.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? "" : r.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm">{r.aspek}</p>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.namaGuru ? `${r.namaGuru} · ` : ""}{r.topikSiklus} · {r.semester === "GANJIL" ? "Ganjil" : "Genap"} {r.tahunAjaran}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {fmtTanggal(r.deadline)}
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 animate-fade-in">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-xs font-semibold text-red-600 uppercase mb-2">Temuan</p>
                            <p className="text-sm text-gray-700">{r.temuan}</p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Rencana Tindak Lanjut</p>
                            <p className="text-sm text-gray-700">{r.rencana}</p>
                          </div>
                          {r.target && (
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                              <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Target Pencapaian</p>
                              <p className="text-sm text-gray-700">{r.target}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Info RTL</p>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Status</span>
                                <Badge variant={sc.variant}>{sc.label}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Deadline</span>
                                <span className="font-medium">{fmtTanggal(r.deadline)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Dari siklus</span>
                                <span className="font-medium">{r.topikSiklus}</span>
                              </div>
                            </div>
                          </div>

                          {/* Hasil monitoring / input progres */}
                          {sudahAdaHasil ? (
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                              <p className="text-xs font-semibold text-green-600 uppercase mb-2">Hasil Monitoring</p>
                              <p className="text-sm text-gray-700">{r.hasilMonitoring}</p>
                            </div>
                          ) : (
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                              <p className="text-xs font-semibold text-orange-500 uppercase mb-2">Catatan Progres</p>
                              <textarea
                                rows={3}
                                className="form-input text-sm"
                                placeholder="Tuliskan progres yang sudah dicapai..."
                                value={progressNotes[r.id] ?? ""}
                                onChange={(e) => setProgressNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              />
                              <button
                                onClick={() => simpanProgres(r)}
                                disabled={savingId === r.id || !(progressNotes[r.id] ?? "").trim()}
                                className="btn-success btn-sm mt-3 w-full justify-center disabled:opacity-50"
                              >
                                {savingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                Simpan Progres
                              </button>
                            </div>
                          )}
                          {savedIds.includes(r.id) && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Progres tersimpan
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">
                  {list.length === 0
                    ? "Belum ada RTL. RTL dibuat supervisor pada tahap Pasca Supervisi."
                    : "Tidak ada RTL dengan status ini"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
