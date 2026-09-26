"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import {
  ExternalLink, CheckCircle2, XCircle, Clock, ShieldCheck, Loader2, Inbox,
} from "lucide-react";

export interface BuktiItem {
  id: string;
  judul: string;
  jenisLabel: string;
  link: string;
  keterangan: string | null;
  status: "MENUNGGU" | "DITERIMA" | "DITOLAK";
  catatanVerifikasi: string | null;
  verifikator: string | null;
  diverifikasiPada: string | null;
  createdAt: string;
}

interface BuktiTugasPanelProps {
  siklusId: string;
  /** tampilkan tombol verifikasi Terima/Tolak (mode supervisor) */
  bisaVerifikasi?: boolean;
  /** teks bila belum ada bukti */
  teksKosong?: string;
}

const statusMap = {
  MENUNGGU: { label: "Menunggu Verifikasi", variant: "warning" as const, cls: "bg-orange-50 border-orange-200 text-orange-600", icon: Clock },
  DITERIMA: { label: "Diterima", variant: "success" as const, cls: "bg-green-50 border-green-200 text-green-600", icon: CheckCircle2 },
  DITOLAK: { label: "Ditolak", variant: "danger" as const, cls: "bg-red-50 border-red-200 text-red-600", icon: XCircle },
};

export default function BuktiTugasPanel({ siklusId, bisaVerifikasi = false, teksKosong }: BuktiTugasPanelProps) {
  const [bukti, setBukti] = useState<BuktiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifikasiId, setVerifikasiId] = useState<string | null>(null);
  const [catatanVerif, setCatatanVerif] = useState<Record<string, string>>({});

  const fetchBukti = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bukti?siklusId=${siklusId}`);
      const json = await res.json();
      if (res.ok) setBukti(json);
    } catch {
      // dibiarkan kosong
    } finally {
      setLoading(false);
    }
  }, [siklusId]);

  useEffect(() => {
    fetchBukti();
  }, [fetchBukti]);

  const verifikasiBukti = async (b: BuktiItem, keputusan: "DITERIMA" | "DITOLAK" | "MENUNGGU") => {
    setVerifikasiId(b.id);
    try {
      const res = await fetch("/api/bukti", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, aksi: "verifikasi", keputusan, catatan: catatanVerif[b.id] ?? "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memverifikasi bukti");
      fetchBukti();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal memverifikasi bukti");
    } finally {
      setVerifikasiId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Memuat bukti...
      </div>
    );
  }

  if (bukti.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        {teksKosong ?? "Guru belum mengumpulkan bukti untuk siklus ini."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bukti.map((b) => {
        const st = statusMap[b.status];
        const StIcon = st.icon;
        return (
          <div key={b.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-700">{b.judul}</p>
                  <Badge variant="info">{b.jenisLabel}</Badge>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                {b.keterangan && <p className="text-xs text-gray-500 mt-1">{b.keterangan}</p>}
                {b.status === "DITERIMA" && b.verifikator && (
                  <p className="text-[11px] text-green-600 mt-1">Diverifikasi oleh {b.verifikator}</p>
                )}
              </div>
              <a
                href={b.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka Link
              </a>
            </div>

            {bisaVerifikasi && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${st.cls}`}>
                  <StIcon className="w-3 h-3" /> {st.label}
                </span>
                {b.status === "MENUNGGU" || b.status === "DITOLAK" ? (
                  <>
                    <input
                      type="text"
                      value={catatanVerif[b.id] ?? ""}
                      onChange={(e) => setCatatanVerif((prev) => ({ ...prev, [b.id]: e.target.value }))}
                      placeholder="Catatan verifikasi (opsional)"
                      className="form-input text-xs py-1.5 flex-1 min-w-[180px]"
                    />
                    <button
                      onClick={() => verifikasiBukti(b, "DITERIMA")}
                      disabled={verifikasiId === b.id}
                      className="btn btn-sm bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 disabled:opacity-60"
                    >
                      {verifikasiId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Terima
                    </button>
                    <button
                      onClick={() => verifikasiBukti(b, "DITOLAK")}
                      disabled={verifikasiId === b.id}
                      className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-60"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => verifikasiBukti(b, "MENUNGGU")}
                    disabled={verifikasiId === b.id}
                    className="btn btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-60"
                  >
                    <Clock className="w-3.5 h-3.5" /> Batalkan Verifikasi
                  </button>
                )}
              </div>
            )}
            {b.status === "DITOLAK" && b.catatanVerifikasi && (
              <p className="mt-2 text-xs text-red-500">Catatan penolakan: {b.catatanVerifikasi}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
