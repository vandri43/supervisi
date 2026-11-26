"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Loader2, ShieldCheck, BarChart3, TrendingUp, Users, ClipboardCheck, Camera, Film, X, FileBadge, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
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

// ─── Carousel galeri dokumentasi ────────────────────────────────────────────
function GaleriCarousel({ items, onLihat }: { items: GaleriItem[]; onLihat: (g: GaleriItem) => void }) {
  const [aktif, setAktif] = useState(0);
  const [pause, setPause] = useState(false);
  const total = items.length;

  // Auto-play setiap 4 detik
  useEffect(() => {
    if (pause || total <= 1) return;
    const t = setInterval(() => setAktif((p) => (p + 1) % total), 4000);
    return () => clearInterval(t);
  }, [pause, total]);

  const prev = () => { setPause(true); setAktif((p) => (p - 1 + total) % total); };
  const next = () => { setPause(true); setAktif((p) => (p + 1) % total); };
  const goto = (i: number) => { setPause(true); setAktif(i); };

  const item = items[aktif];

  const mediaSrc = (g: GaleriItem) => {
    if (g.tipe === "link" && g.provider === "YOUTUBE" && g.providerId)
      return `https://i.ytimg.com/vi/${g.providerId}/hqdefault.jpg`;
    if (g.tipe !== "link") return g.url;
    return null;
  };

  return (
    <section
      className="mt-6 rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: "linear-gradient(135deg, rgba(16,24,56,0.97) 0%, rgba(10,20,40,0.99) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
      aria-label="Dokumentasi kegiatan observasi kelas"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* Header */}
      <div className="px-6 lg:px-8 pt-5 pb-4 flex items-center justify-between gap-4 flex-wrap border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#2dce89,#2dcecc)" }}>
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f1428] animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm lg:text-base leading-tight">Perjalanan Observasi Kelas</h2>
            <p className="text-white/40 text-[11px]">Dokumentasi nyata kegiatan supervisi pembelajaran di sekolah</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/40 text-xs">{aktif + 1} / {total}</span>
          <button onClick={prev} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Sebelumnya">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={next} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Berikutnya">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Slide utama */}
      <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
        {/* Gambar/video */}
        {item.tipe === "video" ? (
          <video src={item.url} className="w-full h-full object-cover" preload="metadata" muted playsInline />
        ) : item.tipe === "link" && item.provider === "YOUTUBE" && item.providerId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`https://i.ytimg.com/vi/${item.providerId}/hqdefault.jpg`} alt={item.topik ?? ""} className="w-full h-full object-cover" />
        ) : item.tipe === "foto" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.topik ?? "Dokumentasi observasi"} className="w-full h-full object-cover" loading="lazy" key={item.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Film className="w-10 h-10 text-white/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        {/* Klik untuk perbesar */}
        <button
          onClick={() => onLihat(item)}
          className="absolute inset-0 w-full h-full cursor-zoom-in"
          aria-label="Perbesar foto"
        />

        {/* Play icon untuk video */}
        {(item.tipe === "video" || (item.tipe === "link" && item.provider === "YOUTUBE")) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Film className="w-6 h-6 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Info bawah */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4 pointer-events-none">
          {item.topik && <p className="text-white font-semibold text-sm lg:text-base drop-shadow">{item.topik}</p>}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/60 text-[11px]">
              {item.tipe === "video" ? "🎬 Video" : item.tipe === "link" ? "🔗 Link" : "📷 Foto"}
            </span>
            <span className="text-white/30 text-[10px]">·</span>
            <span className="text-white/50 text-[11px]">{item.sumber === "pengawas" ? "Supervisor" : "Guru"}</span>
          </div>
        </div>

        {/* Tombol kiri kanan di atas slide */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors z-10"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors z-10"
              aria-label="Berikutnya"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide border-t border-white/5">
          {items.map((g, i) => {
            const src = mediaSrc(g);
            return (
              <button
                key={g.id}
                onClick={() => goto(i)}
                className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  i === aktif ? "border-emerald-400 scale-105" : "border-white/10 opacity-50 hover:opacity-80"
                }`}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <Film className="w-3 h-3 text-white/50" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Dot indicator + footer */}
      <div className="px-6 py-3 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goto(i)}
              className={`rounded-full transition-all ${i === aktif ? "w-5 h-2 bg-emerald-400" : "w-2 h-2 bg-white/20 hover:bg-white/40"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <p className="text-white/25 text-[10px]">Dokumentasi bukti otentik supervisi pembelajaran</p>
      </div>
    </section>
  );
}


// ─── Halaman Login ───────────────────────────────────────────────────────────
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

        {/* ================= GALERI CAROUSEL DOKUMENTASI OBSERVASI ================= */}
        {!galeriLoaded ? (
          <section className="mt-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 lg:p-8 shadow-2xl">
            <div className="h-56 flex items-center justify-center text-white/40 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat dokumentasi...
            </div>
          </section>
        ) : galeri.length > 0 && (
          <GaleriCarousel
            items={galeri}
            onLihat={(g) => setGaleriLihat(g)}
          />
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
    </div>
  );
}
