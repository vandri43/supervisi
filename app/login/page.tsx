"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Loader2, ShieldCheck, BarChart3, TrendingUp, Users, ClipboardCheck, Camera, Film, X } from "lucide-react";
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

  const perGuru = (stat?.perGuru ?? []).filter((g) => g.nilai !== null);
  const agregat = stat?.ada ? stat.agregat : null;
  const distribusi = agregat?.distribusiPredikat ?? [];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #5e72e4, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2dce89, transparent)" }} />
      </div>

      <div className="relative w-full max-w-6xl">
        {/* Header */}
        <BrandHeader />

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-stretch">
          {/* ================= PANEL STATISTIK (kiri, di bawah form di mobile) ================= */}
          <section
            className="order-2 lg:order-1 lg:col-span-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 lg:p-8 shadow-2xl"
            aria-label="Hasil supervisi guru"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-300" />
                  Hasil Supervisi Guru
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  Rekap nilai hasil supervisi · identitas guru disamarkan
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Nama Disamarkan
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
                <span className="text-white/25 text-xs mt-1">Hasil akan tampil di sini setelah proses supervisi selesai.</span>
              </div>
            ) : (
              <>
                {/* Ringkasan angka */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <p className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                      {agregat?.rataRata != null ? agregat.rataRata.toFixed(1) : "—"}
                    </p>
                    <p className="text-white/40 text-[11px] mt-0.5">Rata-rata / 100</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <p className="text-2xl lg:text-3xl font-bold text-white leading-tight flex items-center justify-center gap-1.5">
                      <Users className="w-5 h-5 text-indigo-300" />{agregat?.jumlahGuru ?? 0}
                    </p>
                    <p className="text-white/40 text-[11px] mt-0.5">Guru Disupervisi</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <p className="text-2xl lg:text-3xl font-bold text-white leading-tight flex items-center justify-center gap-1.5">
                      <TrendingUp className="w-5 h-5 text-emerald-300" />{agregat?.tertinggi != null ? agregat.tertinggi.toFixed(0) : "—"}
                    </p>
                    <p className="text-white/40 text-[11px] mt-0.5">Nilai Tertinggi</p>
                  </div>
                </div>

                {/* Grafik - dimuat lazy (recharts terpisah dari bundle awal) */}
                <ChartLazy
                  perGuru={perGuru.map((g) => ({ label: g.label, nilai: g.nilai, predikat: g.predikat }))}
                  distribusi={distribusi}
                  rataTahap={{
                    pra: agregat?.rataRataTahap.pra ?? null,
                    observasi: agregat?.rataRataTahap.observasi ?? null,
                    pasca: agregat?.rataRataTahap.pasca ?? null,
                  }}
 />
              </>
            )}
          </section>

          {/* ================= FORM LOGIN (kanan, di atas panel statistik di mobile) ================= */}
          <section className="order-1 lg:order-2 lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-gray-800 text-xl font-bold mb-1">Selamat Datang</h2>
              <p className="text-gray-400 text-sm mb-6">Masuk ke akun Anda untuk melanjutkan</p>

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
                  className="w-full btn-primary py-3 rounded-lg flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </button>
              </form>

              {/* Lupa password */}
              <div className="mt-4 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Lupa password?
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* ================= GALERI DOKUMENTASI PUBLIK ================= */}
        {!galeriLoaded ? null : galeri.length > 0 && (
          <section
            className="mt-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 lg:p-8 shadow-2xl"
            aria-label="Dokumentasi kegiatan supervisi"
          >
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
              <div>
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-300" />
                  Dokumentasi Kegiatan Supervisi
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  Foto & video kegiatan supervisi di sekolah — bukti nyata pelaksanaan
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] flex-wrap">
                <span className="inline-flex items-center gap-1 text-white/60 bg-white/10 border border-white/15 rounded-full px-3 py-1">
                  <Camera className="w-3 h-3" /> {galeri.filter((g) => g.tipe === "foto").length} Foto
                </span>
                <span className="inline-flex items-center gap-1 text-white/60 bg-white/10 border border-white/15 rounded-full px-3 py-1">
                  <Film className="w-3 h-3" /> {galeri.filter((g) => g.tipe !== "foto").length} Video/Link
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {galeri.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGaleriLihat(g)}
                  className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/30 aspect-[4/3]"
                >
                  {g.tipe === "link" && g.provider === "YOUTUBE" && g.providerId ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://i.ytimg.com/vi/${g.providerId}/hqdefault.jpg`}
                        alt={g.topik ?? "Video YouTube"}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-red-600 text-white rounded-full p-2 shadow-lg">
                          <Film className="w-4 h-4" />
                        </span>
                      </span>
                    </>
                  ) : g.tipe === "link" ? (
                    <span className="flex w-full h-full flex-col items-center justify-center gap-1.5 text-white/70">
                      <Film className="w-5 h-5" />
                      <span className="text-[9px]">{g.provider === "GDRIVE" ? "Google Drive" : "Link"}</span>
                    </span>
                  ) : g.tipe === "video" ? (
                    <video
                      src={g.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.url} alt={g.topik ?? "Dokumentasi supervisi"} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                  {g.tipe === "video" && (
                    <span className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1">
                      <Film className="w-3 h-3" />
                    </span>
                  )}
                  <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-black/60 text-white/90">
                    {g.sumber === "pengawas" ? "Supervisi" : "Guru"}
                  </span>
                  {g.topik && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-3 pb-1 text-[10px] text-white/90 truncate text-left">
                      {g.topik}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Lightbox galeri (foto perbesar / video putar) */}
        {galeriLihat && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setGaleriLihat(null)}>
            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {galeriLihat.tipe === "video" ? "Video" : "Foto"} dokumentasi{galeriLihat.topik ? ` — ${galeriLihat.topik}` : ""}
                  </p>
                  <p className="text-white/50 text-xs">Kegiatan supervisi guru di sekolah</p>
                </div>
                <button onClick={() => setGaleriLihat(null)} className="btn btn-sm bg-white/10 text-white hover:bg-white/20">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {galeriLihat.tipe === "link" && galeriLihat.provider === "YOUTUBE" && galeriLihat.providerId ? (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${galeriLihat.providerId}`}
                    title={galeriLihat.topik ?? "Video YouTube"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : galeriLihat.tipe === "link" && galeriLihat.provider === "GDRIVE" && galeriLihat.providerId ? (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://drive.google.com/file/d/${galeriLihat.providerId}/preview`}
                    title={galeriLihat.topik ?? "Dokumen Drive"}
                    allow="autoplay"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : galeriLihat.tipe === "link" ? (
                <div className="p-8 text-center bg-white/10 rounded-xl">
                  <p className="text-white/70 text-sm mb-3">Pratinjau tidak tersedia untuk link ini.</p>
                  <a href={galeriLihat.url} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
                    Buka Link
                  </a>
                </div>
              ) : galeriLihat.tipe === "video" ? (
                <video src={galeriLihat.url} controls autoPlay playsInline className="w-full max-h-[75vh] rounded-xl bg-black" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={galeriLihat.url} alt={galeriLihat.topik ?? "Dokumentasi supervisi"} className="w-full max-h-[75vh] object-contain rounded-xl" />
              )}
            </div>
          </div>
        )}

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Sistem Supervisi Guru
        </p>
      </div>
    </div>
  );
}
