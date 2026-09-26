"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, KeyRound, MailCheck, Copy, Check } from "lucide-react";
import BrandHeader from "@/components/BrandHeader";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Terjadi kesalahan. Coba lagi.");
      return;
    }

    setSent(true);
    setResetUrl(data.resetUrl ?? null);
  }

  function getFullUrl(path: string) {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #5e72e4, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2dce89, transparent)" }} />
      </div>

      <div className="relative w-full max-w-md">
        <BrandHeader />

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!sent ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-800 text-xl font-bold leading-tight">Lupa Password?</h2>
                  <p className="text-gray-400 text-sm">Masukkan email akun Anda</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-3 mb-6">
                Kami akan membuat tautan reset password. Hubungi administrator sistem untuk mendapatkan token
                reset (pengiriman email otomatis belum diaktifkan).
              </p>

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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Buat Tautan Reset"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                  <MailCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-800 text-xl font-bold leading-tight">Permintaan Dikirim</h2>
                  <p className="text-gray-400 text-sm">Periksa email Anda (jika terdaftar)</p>
                </div>
              </div>

              {resetUrl ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-indigo-700 mb-2">
                    Mode pengembangan — tautan reset:
                  </p>
                  <code className="block text-xs text-indigo-600 break-all bg-white rounded-lg px-3 py-2 border border-indigo-100">
                    {getFullUrl(resetUrl)}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getFullUrl(resetUrl));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Tersalin!" : "Salin tautan"}
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-4">
                  Tautan reset telah dibuat dan dikirim ke email Anda. Tidak menerima? Hubungi administrator
                  sistem.
                </p>
              )}

              <Link
                href={`/reset-password?token=${resetUrl?.split("token=")[1] ?? ""}`}
                className="w-full btn-primary py-3 rounded-lg flex items-center justify-center gap-2 mb-2"
              >
                <KeyRound className="w-4 h-4" />
                Reset Sekarang
              </Link>
            </>
          )}

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
