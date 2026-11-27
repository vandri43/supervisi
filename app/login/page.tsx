"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Loader2, ShieldCheck, BarChart3, ClipboardCheck, Camera, Film, X, FileBadge, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import BrandHeader from "@/components/BrandHeader";

// Recharts (~130KB) dimuat LAZY terpisah — halaman login tampil lebih cepat
const ChartLazy = dynamic(() => import("@/components/GrafikLogin"), {
  loading: () => <div className="h-52 animate-pulse rounded-lg bg-white/10" />,
  ssr: false,
});

interface GuruStat {
  label: string;
  mapel: string | null;
  pra: number | null;
  observasi: number | null;
  pasca: number | null;
  nilai: number | null;
  predikat: string | null;
}

interface Statistik {
  ada: boolean;
  perGuru: GuruStat[];
  agregat: {
    rataRata: number | null;
    tertinggi: number | null;
    terendah: number | null;
    jumlahGuru: number;
    jumlahSiklus: number;
    rataRataTahap: { pra: number | null; observasi: number | null; pasca: number | null };
    distribusiPredikat: { predikat: string; label: string; jumlah: number }[];
  } | null;
}

interface GaleriItem {
  id: string;
  url: string;
  provider: string | null;
  providerId: string | null;
  tipe: "foto" | "video" | "link";
  sumber: "pengawas" | "guru";
  topik: string | null;
}

interface SkItem {
  id: string;
  judul: string;
  tipe: "pdf" | "gambar";
  url: string;
  keterangan: string | null;
}

// ─── Thumbnail kartu galeri (untuk grid) ────────────────────────────────────
function GaleriThumb({ item, besar = false, onClick }: { item: GaleriItem; besar?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 block ${besar ? "aspect-[16/9] lg:aspect-[4/3]" : "aspect-[4/3]"}`}
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
    >
      {item.tipe === "link" && item.provider === "YOUTUBE" && item.providerId ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${item.providerId}/hqdefault.jpg`} alt={item.topik ?? ""} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-11 h-11 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Film className="w-5 h-5 text-white ml-0.5" />
            </span>
          </span>
        </>
      ) : item.tipe === "link" ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-900/60 to-indigo-900/60">
          <Film className="w-7 h-7 text-purple-300" />
          <span className="text-[11px] text-white/60">{item.provider === "GDRIVE" ? "Google Drive" : "Link"}</span>
        </div>
      ) : item.tipe === "video" ? (
        <>
          <video src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" preload="metadata" muted playsInline />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Film className="w-4 h-4 text-white ml-0.5" />
            </span>
          </span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.topik ?? "Dokumentasi observasi"} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-2">
        {item.topik && <p className={`text-white font-medium truncate ${besar ? "text-sm" : "text-[11px]"}`}>{item.topik}</p>}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-white/50 ${besar ? "text-xs" : "text-[10px]"}`}>{item.tipe === "video" ? "🎬 Video" : item.tipe === "link" ? "🔗 Link" : "📷 Foto"}</span>
          <span className="text-white/20 text-[9px]">·</span>
          <span className={`text-white/40 ${besar ? "text-xs" : "text-[10px]"}`}>{item.sumber === "pengawas" ? "Supervisor" : "Guru"}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Halaman Login ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stat, setStat] = useState<Statistik | null>(null);
  const [statLoaded, setStatLoaded] = useState(false);
  const [galeri, setGaleri] = useState<GaleriItem[]>([]);
  const [galeriLoaded, setGaleriLoaded] = useState(false);
  const [galeriLihat, setGaleriLihat] = useState<GaleriItem | null>(null);
  const [filterTopik, setFilterTopik] = useState<string | null>(null);
  const [skList, setSkList] = useState<SkItem[]>([]);
  const [skLoaded, setSkLoaded] = useState(false);
  const [skLihat, setSkLihat] = useState<SkItem | null>(null);

  useEffect(() => {
    fetch("/api/public/statistik")
      .then((r) => r.json())
      .then((data: Statistik) => setStat(data))
      .catch(() => {})
      .finally(() => setStatLoaded(true));
    fetch("/api/public/galeri")
      .then((r) => r.json())
      .then((data: { ada: boolean; items: GaleriItem[] }) => setGaleri(data.ada ? data.items : []))
      .catch(() => {})
      .finally(() => setGaleriLoaded(true));
    fetch("/api/public/sk")
      .then((r) => r.json())
      .then((data: { ada: boolean; items: SkItem[] }) => setSkList(data.ada ? data.items : []))
      .catch(() => {})
      .finally(() => setSkLoaded(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const [showLoginModal, setShowLoginModal] = useState(false);

  const perGuru = (stat?.perGuru ?? []).filter((g) => g.nilai !== null);
  const agregat = stat?.ada ? stat.agregat : null;
  const distribusi = agregat?.distribusiPredikat ?? [];

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #5e72e4, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2dce89, transparent)" }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto">
        {/* Header + tombol masuk */}
        <div className="flex items-center justify-between mb-8">
          <BrandHeader />
          <button
            onClick={() => setShowLoginModal(true)}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2 flex-shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            Masuk ke Sistem
          </button>
        </div>

        {/* ================= PANEL STATISTIK FULL WIDTH ================= */}
        <section
          className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 lg:p-8 shadow-2xl mb-6"
          aria-label="Hasil supervisi guru"
        >
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-300" />
                Hasil Supervisi Guru
              </h2>
              <p className="text-white/40 text-xs mt-1">Rekap nilai hasil supervisi · identitas guru disamarkan</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Nama Disamarkan
            </span>
          </div>

          {!statLoaded ? (
            <div className="h-64 flex items-center justify-center text-white/40 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat data supervisi...
            </div>
          ) : !stat?.ada || perGuru.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-white/40 text-sm px-4">
              <ClipboardCheck className="w-10 h-10 mb-3 text-white/20" />
              Belum ada hasil supervisi yang dipublikasikan.
            </div>
          ) : (
            <>
              {/* Ringkasan angka — 4 kartu */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Rata-rata Nilai", value: agregat?.rataRata != null ? agregat.rataRata.toFixed(1) : "—", sub: "dari 100", color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/30", text: "text-indigo-300" },
                  { label: "Guru Disupervisi", value: String(agregat?.jumlahGuru ?? 0), sub: "orang", color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/30", text: "text-emerald-300" },
                  { label: "Nilai Tertinggi", value: agregat?.tertinggi != null ? agregat.tertinggi.toFixed(0) : "—", sub: "dari 100", color: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/30", text: "text-amber-300" },
                  { label: "Nilai Terendah", value: agregat?.terendah != null ? agregat.terendah.toFixed(0) : "—", sub: "dari 100", color: "from-rose-500/20 to-rose-600/10", border: "border-rose-500/30", text: "text-rose-300" },
                ].map((k) => (
                  <div key={k.label} className={`rounded-xl bg-gradient-to-br ${k.color} border ${k.border} p-4 text-center`}>
                    <p className={`text-3xl font-bold ${k.text} leading-tight`}>{k.value}</p>
                    <p className="text-white/30 text-[11px] mt-0.5">{k.sub}</p>
                    <p className="text-white/60 text-xs font-medium mt-1">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Grafik full-width + side panel */}
              <div className="grid lg:grid-cols-3 gap-5">
                {/* Bar chart — 2/3 lebar */}
                <div className="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <p className="text-white/80 text-sm font-semibold">Nilai per Guru (Anonim)</p>
                    <div className="flex items-center gap-3 text-[11px]">
                      {[["#2dce89","Sangat Baik"],["#5e72e4","Baik"],["#fb6340","Cukup"],["#f5365c","Kurang"]].map(([c,l]) => (
                        <span key={l} className="flex items-center gap-1 text-white/50">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChartLazy
                    perGuru={perGuru.map((g) => ({ label: g.label, nilai: g.nilai, predikat: g.predikat }))}
                    distribusi={distribusi}
                    rataTahap={{
                      pra: agregat?.rataRataTahap.pra ?? null,
                      observasi: agregat?.rataRataTahap.observasi ?? null,
                      pasca: agregat?.rataRataTahap.pasca ?? null,
                    }}
                  />
                </div>

                {/* Side panel — 1/3 lebar */}
                <div className="space-y-4">
                  {/* Distribusi predikat */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-white/80 text-sm font-semibold mb-3">Distribusi Predikat</p>
                    <div className="space-y-2.5">
                      {[
                        { p: "SANGAT_BAIK", label: "Sangat Baik", color: "#2dce89" },
                        { p: "BAIK", label: "Baik", color: "#5e72e4" },
                        { p: "CUKUP", label: "Cukup", color: "#fb6340" },
                        { p: "KURANG", label: "Kurang", color: "#f5365c" },
                      ].map(({ p, label, color }) => {
                        const d = distribusi.find((x) => x.predikat === p);
                        const jumlah = d?.jumlah ?? 0;
                        const total = distribusi.reduce((a, x) => a + x.jumlah, 0);
                        const pct = total > 0 ? (jumlah / total) * 100 : 0;
                        return (
                          <div key={p}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="flex items-center gap-1.5 text-white/70">
                                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                {label}
                              </span>
                              <span className="text-white font-semibold">{jumlah} guru</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rata-rata per tahap */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-white/80 text-sm font-semibold mb-3">Rata-rata per Tahap</p>
                    <div className="space-y-3">
                      {([
                        ["Pra Observasi", agregat?.rataRataTahap.pra, "#5e72e4"],
                        ["Observasi Kelas", agregat?.rataRataTahap.observasi, "#2dce89"],
                        ["Pasca Supervisi", agregat?.rataRataTahap.pasca, "#fb6340"],
                      ] as [string, number | null | undefined, string][]).map(([tahap, nilai, color]) => (
                        <div key={tahap}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60">{tahap}</span>
                            <span className="text-white font-bold">{nilai != null ? nilai.toFixed(1) : "—"}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${nilai ?? 0}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ================= GALERI DOKUMENTASI OBSERVASI KELAS ================= */}
        {!galeriLoaded ? (
          <section className="mt-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 lg:p-8 shadow-2xl">
            <div className="h-56 flex items-center justify-center text-white/40 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat dokumentasi...
            </div>
          </section>
        ) : galeri.length > 0 && (
          <section
            className="mt-6 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, rgba(16,24,56,0.95) 0%, rgba(10,20,40,0.98) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
            aria-label="Dokumentasi kegiatan observasi kelas"
          >
            {/* Header */}
            <div className="px-6 lg:px-8 pt-5 pb-4 flex items-center justify-between gap-4 flex-wrap border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#2dce89,#2dcecc)" }}>
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f1428] animate-pulse" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm lg:text-base">Perjalanan Observasi Kelas</h2>
                  <p className="text-white/40 text-[11px]">Dokumentasi nyata kegiatan supervisi pembelajaran di sekolah</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                {galeri.filter((g) => g.tipe === "foto").length > 0 && (
                  <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-1">
                    <Camera className="w-3 h-3" /> {galeri.filter((g) => g.tipe === "foto").length} Foto
                  </span>
                )}
                {galeri.filter((g) => g.tipe !== "foto").length > 0 && (
                  <span className="inline-flex items-center gap-1 text-blue-300 bg-blue-400/10 border border-blue-400/20 rounded-full px-2.5 py-1">
                    <Film className="w-3 h-3" /> {galeri.filter((g) => g.tipe !== "foto").length} Video/Link
                  </span>
                )}
              </div>
            </div>

            {/* Grid layout: hero kiri besar + grid kanan */}
            <div className="p-4 lg:p-5">
              {(() => {
                const tampil = filterTopik ? galeri.filter((g) => g.topik === filterTopik) : galeri;
                return tampil.length === 1 ? (
                  <GaleriThumb item={tampil[0]} besar onClick={() => setGaleriLihat(tampil[0])} />
                ) : tampil.length <= 3 ? (
                  <div className={`grid gap-3 ${tampil.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {tampil.map((g) => <GaleriThumb key={g.id} item={g} onClick={() => setGaleriLihat(g)} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-3">
                      <GaleriThumb item={tampil[0]} besar onClick={() => setGaleriLihat(tampil[0])} />
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                      {tampil.slice(1, 5).map((g, idx) => (
                        <div key={g.id} className="relative">
                          <GaleriThumb item={g} onClick={() => setGaleriLihat(g)} />
                          {idx === 3 && tampil.length > 5 && (
                            <button
                              onClick={() => setGaleriLihat(tampil[5])}
                              className="absolute inset-0 rounded-xl bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-1 hover:bg-black/50 transition-colors"
                            >
                              <span className="text-white text-2xl font-bold">+{tampil.length - 5}</span>
                              <span className="text-white/60 text-xs">foto lainnya</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Strip topik — klik untuk filter foto per topik */}
              {galeri.some((g) => g.topik) && (() => {
                const topikList = Array.from(new Set(galeri.map((g) => g.topik).filter(Boolean))) as string[];
                return (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-white/30 text-[11px]">Topik ({topikList.length}):</span>
                      <span className="text-white/20 text-[10px]">← geser untuk melihat semua →</span>
                    </div>
                    <div
                      className="flex items-center gap-2 overflow-x-auto pb-2"
                      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}
                    >
                      <button
                        onClick={() => setFilterTopik(null)}
                        className={`flex-shrink-0 text-[11px] rounded-full px-3 py-1.5 border transition-all font-medium ${
                          filterTopik === null
                            ? "bg-emerald-400/30 border-emerald-400/60 text-emerald-200"
                            : "bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/80"
                        }`}
                      >
                        🗂 Semua ({galeri.length})
                      </button>
                      {topikList.map((t) => {
                        const jumlah = galeri.filter((g) => g.topik === t).length;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setFilterTopik(t === filterTopik ? null : t);
                              const foto = galeri.find((g) => g.topik === t);
                              if (foto && t !== filterTopik) setGaleriLihat(foto);
                            }}
                            className={`flex-shrink-0 text-[11px] rounded-full px-3 py-1.5 border transition-all whitespace-nowrap ${
                              filterTopik === t
                                ? "bg-emerald-400/30 border-emerald-400/60 text-emerald-200 font-medium"
                                : "bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/80"
                            }`}
                          >
                            📷 {t} <span className="opacity-60">({jumlah})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 lg:px-8 py-3 border-t border-white/5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-white/25 text-[11px]">Dokumentasi kegiatan supervisi guru sebagai bukti otentik peningkatan mutu pembelajaran</p>
            </div>
          </section>
        )}

        {/* ================= DOKUMEN SK PUBLIK ================= */}
        {!skLoaded ? null : skList.length > 0 && (
          <section
            className="mt-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 lg:p-8 shadow-2xl"
            aria-label="Dokumen SK"
          >
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
              <div>
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <FileBadge className="w-5 h-5 text-amber-300" />
                  Dokumen SK (Surat Keputusan)
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  SK resmi sekolah — dokumen PDF terbuka otomatis, klik untuk melihat
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-white/60 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px]">
                <FileBadge className="w-3 h-3" /> {skList.length} Dokumen
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {skList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSkLihat(s)}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-colors text-left"
                >
                  {s.tipe === "gambar" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.url}
                      alt={s.judul}
                      loading="lazy"
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/10"
                    />
                  ) : (
                    <span className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/15 border border-red-400/20">
                      <FileBadge className="w-6 h-6 text-red-300" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white truncate">{s.judul}</span>
                    <span className="block text-[11px] text-white/40 truncate">
                      {s.tipe === "pdf" ? "PDF" : "Gambar"}
                      {s.keterangan ? ` · ${s.keterangan}` : ""}
                    </span>
                  </span>
                  <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Lightbox galeri (foto perbesar / video putar) — bisa digeser kiri kanan */}
        {galeriLihat && (() => {
          const tampil = filterTopik ? galeri.filter((g) => g.topik === filterTopik) : galeri;
          const idx = tampil.findIndex((g) => g.id === galeriLihat.id);
          const idxAktual = idx >= 0 ? idx : 0;
          const prev = tampil[(idxAktual - 1 + tampil.length) % tampil.length];
          const next = tampil[(idxAktual + 1) % tampil.length];
          return (
            <div
              className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4"
              onClick={() => setGaleriLihat(null)}
            >
              <div className="max-w-4xl w-full relative" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {galeriLihat.tipe === "video" ? "🎬 Video" : "📷 Foto"}{galeriLihat.topik ? ` — ${galeriLihat.topik}` : ""}
                    </p>
                    <p className="text-white/40 text-xs">{idxAktual + 1} / {tampil.length} · {galeriLihat.sumber === "pengawas" ? "Supervisor" : "Guru"}</p>
                  </div>
                  <button onClick={() => setGaleriLihat(null)} className="btn btn-sm bg-white/10 text-white hover:bg-white/20 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Media */}
                {galeriLihat.tipe === "link" && galeriLihat.provider === "YOUTUBE" && galeriLihat.providerId ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe src={`https://www.youtube.com/embed/${galeriLihat.providerId}`} title={galeriLihat.topik ?? "Video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                  </div>
                ) : galeriLihat.tipe === "link" && galeriLihat.provider === "GDRIVE" && galeriLihat.providerId ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe src={`https://drive.google.com/file/d/${galeriLihat.providerId}/preview`} title={galeriLihat.topik ?? "Drive"} allow="autoplay" allowFullScreen className="w-full h-full" />
                  </div>
                ) : galeriLihat.tipe === "link" ? (
                  <div className="p-8 text-center bg-white/10 rounded-xl">
                    <p className="text-white/70 text-sm mb-3">Pratinjau tidak tersedia.</p>
                    <a href={galeriLihat.url} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">Buka Link</a>
                  </div>
                ) : galeriLihat.tipe === "video" ? (
                  <video src={galeriLihat.url} controls autoPlay playsInline className="w-full max-h-[75vh] rounded-xl bg-black" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={galeriLihat.url} alt={galeriLihat.topik ?? "Dokumentasi"} className="w-full max-h-[75vh] object-contain rounded-xl" />
                )}

                {/* Navigasi kiri kanan */}
                {tampil.length > 1 && (
                  <>
                    <button
                      onClick={() => setGaleriLihat(prev)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
                      aria-label="Sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => setGaleriLihat(next)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
                      aria-label="Berikutnya"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Thumbnail strip bawah */}
                {tampil.length > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto pb-1">
                    {tampil.map((g, i) => (
                      <button
                        key={g.id}
                        onClick={() => setGaleriLihat(g)}
                        className={`flex-shrink-0 w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                          i === idxAktual ? "border-emerald-400 scale-110" : "border-white/10 opacity-40 hover:opacity-70"
                        }`}
                      >
                        {g.tipe === "foto" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : g.tipe === "link" && g.provider === "YOUTUBE" && g.providerId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`https://i.ytimg.com/vi/${g.providerId}/default.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <Film className="w-3 h-3 text-white/50" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Lightbox dokumen SK (PDF embed / gambar perbesar) */}
        {skLihat && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setSkLihat(null)}>
            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {skLihat.tipe === "pdf" ? "Dokumen SK (PDF)" : "Dokumen SK (Gambar)"}
                    {skLihat.judul ? ` — ${skLihat.judul}` : ""}
                  </p>
                  <p className="text-white/50 text-xs">Surat Keputusan resmi sekolah</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={skLihat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm bg-white/10 text-white hover:bg-white/20"
                  >
                    Tab Baru
                  </a>
                  <button onClick={() => setSkLihat(null)} className="btn btn-sm bg-white/10 text-white hover:bg-white/20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {skLihat.tipe === "pdf" ? (
                <div className="w-full rounded-xl overflow-hidden bg-white" style={{ height: "80vh" }}>
                  <object data={skLihat.url} type="application/pdf" className="w-full h-full">
                    <div className="p-8 text-center bg-gray-900 rounded-xl">
                      <p className="text-white/70 text-sm mb-3">Pratinjau PDF tidak didukung browser ini.</p>
                      <a href={skLihat.url} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
                        Buka PDF di Tab Baru
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={skLihat.url} alt={skLihat.judul} className="w-full max-h-[80vh] object-contain rounded-xl" />
              )}
            </div>
          </div>
        )}

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Sistem Supervisi Guru
        </p>
      </div>

      {/* ================= MODAL LOGIN POPUP ================= */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tutup */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo kecil */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #5e72e4, #825ee4)" }}>
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-gray-800 text-lg font-bold leading-tight">Selamat Datang</h2>
                <p className="text-gray-400 text-xs">Masuk ke Sistem Supervisi Guru</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="form-input"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 mt-2 text-sm font-semibold"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Memproses...</> : "Masuk"}
              </button>
            </form>

            <div className="mt-4 text-right">
              <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Lupa password?
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
