"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface KomponenCetak {
  kode: string;
  rows: { nomor: number; deskripsi: string; skor: number; catatan: string | null }[];
  total: number;
  maks: number;
  persen: number;
}

interface CetakData {
  dicetakPada: string;
  dicetakOleh: string;
  siklus: {
    id: string;
    tahunAjaran: string;
    semester: string;
    status: string;
    kelas: string | null;
    mapel: string | null;
    topikPembelajaran: string | null;
    tanggalMulai: string | null;
    tanggalSelesai: string | null;
    catatan: string | null;
    guru: { nama: string; nip: string | null; jabatan: string | null; mapel: string | null };
    supervisor: { nama: string; nip: string | null; jabatan: string | null };
    sekolah: { nama: string; npsn: string | null; alamat: string | null; kabupaten: string | null; provinsi: string | null } | null;
  };
  praObservasi: {
    tanggal: string | null;
    totalSkor: number;
    nilaiAkhir: number;
    predikat: string | null;
    selesai: boolean;
    catatanUmum: string | null;
    komponen: KomponenCetak[];
    konferensi: { nomor: number; pertanyaan: string; jawaban: string | null }[];
  } | null;
  observasiKelas: {
    tanggal: string | null;
    totalSkor: number;
    skorMaks: number;
    nilaiAkhir: number;
    predikat: string | null;
    selesai: boolean;
    catatanUmum: string | null;
    komponen: KomponenCetak[];
  } | null;
  pascaSupervisi: {
    tanggal: string | null;
    totalSkor: number;
    nilaiAkhir: number;
    predikat: string | null;
    selesai: boolean;
    catatanUmum: string | null;
    komponen: KomponenCetak[];
    rtl: { aspek: string; temuan: string; rencana: string; target: string | null; deadline: string | null; statusMonitoring: string; hasilMonitoring: string | null }[];
  } | null;
}

const fmt = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

const predikatLabel = (p: string | null) => (p ? p.replace("_", " ") : "—");

function TabelKomponen({ judul, komponen }: { judul: string; komponen: KomponenCetak[] }) {
  if (komponen.length === 0) {
    return (
      <p className="komentar-kosong">Belum ada indikator yang diisi pada tahap {judul}.</p>
    );
  }
  return (
    <table className="tabel-cetak">
      <thead>
        <tr>
          <th style={{ width: 60 }}>Kode</th>
          <th style={{ width: 40 }}>No</th>
          <th>Indikator</th>
          <th style={{ width: 45 }}>Skor</th>
          <th style={{ width: 55 }}>Maks</th>
          <th style={{ width: 190 }}>Catatan</th>
        </tr>
      </thead>
      <tbody>
        {komponen.map((k) => (
          <>
            <tr key={k.kode} className="baris-komponen">
              <td colSpan={6}>
                <strong>Komponen {k.kode}</strong> — Skor {k.total}/{k.maks} ({k.persen}%)
              </td>
            </tr>
            {k.rows.map((r) => (
              <tr key={`${k.kode}-${r.nomor}`}>
                <td className="center">{k.kode}</td>
                <td className="center">{r.nomor}</td>
                <td>{r.deskripsi}</td>
                <td className="center">{r.skor}</td>
                <td className="center">4</td>
                <td className="catatan">{r.catatan ?? ""}</td>
              </tr>
            ))}
          </>
        ))}
      </tbody>
    </table>
  );
}

export default function CetakSiklusPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CetakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCetak = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/siklus/${id}/cetak`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat laporan");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCetak();
  }, [fetchCetak]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Menyiapkan laporan...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center border rounded-xl p-8">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 text-sm mb-4">{error || "Laporan tidak ditemukan"}</p>
          <Link href={`/supervisor/siklus/${id}`} className="text-indigo-600 text-sm underline">
            Kembali ke detail siklus
          </Link>
        </div>
      </div>
    );
  }

  const s = data.siklus;
  const nilaiSiklus =
    data.pascaSupervisi?.selesai
      ? data.pascaSupervisi.nilaiAkhir
      : data.observasiKelas?.selesai
      ? data.observasiKelas.nilaiAkhir
      : data.praObservasi?.selesai
      ? data.praObservasi.nilaiAkhir
      : null;
  const predikatSiklus =
    data.pascaSupervisi?.selesai
      ? data.pascaSupervisi.predikat
      : data.observasiKelas?.selesai
      ? data.observasiKelas.predikat
      : data.praObservasi?.selesai
      ? data.praObservasi.predikat
      : null;
  const rtlSemua = data.pascaSupervisi?.rtl ?? [];

  return (
    <div className="kertas-wrapper">
      {/* Toolbar (tidak ikut tercetak) */}
      <div className="toolbar-cetak no-print">
        <Link href={`/supervisor/siklus/${id}`} className="tombol tombol-abu">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <button onClick={() => window.print()} className="tombol tombol-primary">
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* Kertas A4 */}
      <div className="kertas">
        {/* Kop */}
        <div className="kop">
          {s.sekolah ? (
            <>
              <p className="kop-baris1">PEMERINTAH {s.sekolah.provinsi ? s.sekolah.provinsi.toUpperCase() : ""}</p>
              <p className="kop-baris2">{s.sekolah.nama.toUpperCase()}</p>
              <p className="kop-baris3">
                {s.sekolah.alamat ?? ""}{s.sekolah.kabupaten ? ` — ${s.sekolah.kabupaten}` : ""}
                {s.sekolah.npsn ? ` · NPSN: ${s.sekolah.npsn}` : ""}
              </p>
            </>
          ) : (
            <p className="kop-baris2">LAPORAN SUPERVISI GURU</p>
          )}
          <p className="kop-judul">LAPORAN HASIL SUPERVISI PEMBELAJARAN</p>
          <p className="kop-sub">
            Tahun Ajaran {s.tahunAjaran} · Semester {s.semester === "GANJIL" ? "Ganjil" : "Genap"}
          </p>
        </div>
        <hr className="kop-garis" />

        {/* Identitas */}
        <table className="tabel-identitas">
          <tbody>
            <tr>
              <td className="label">Nama Guru</td>
              <td className="titik">:</td>
              <td><strong>{s.guru.nama}</strong></td>
              <td className="label">Mata Pelajaran</td>
              <td className="titik">:</td>
              <td>{s.mapel ?? s.guru.mapel ?? "-"}</td>
            </tr>
            <tr>
              <td className="label">NIP</td>
              <td className="titik">:</td>
              <td>{s.guru.nip ?? "-"}</td>
              <td className="label">Kelas</td>
              <td className="titik">:</td>
              <td>{s.kelas ?? "-"}</td>
            </tr>
            <tr>
              <td className="label">Jabatan</td>
              <td className="titik">:</td>
              <td>{s.guru.jabatan ?? "-"}</td>
              <td className="label">Topik</td>
              <td className="titik">:</td>
              <td>{s.topikPembelajaran ?? "-"}</td>
            </tr>
            <tr>
              <td className="label">Supervisor</td>
              <td className="titik">:</td>
              <td>{s.supervisor.nama}</td>
              <td className="label">Tanggal</td>
              <td className="titik">:</td>
              <td>{fmt(s.tanggalMulai)} s.d. {fmt(s.tanggalSelesai)}</td>
            </tr>
          </tbody>
        </table>

        {/* Ringkasan */}
        <h3 className="judul-bagian">A. Ringkasan Hasil</h3>
        <table className="tabel-cetak">
          <thead>
            <tr>
              <th>Tahap</th>
              <th style={{ width: 110 }}>Tanggal</th>
              <th style={{ width: 90 }}>Total Skor</th>
              <th style={{ width: 80 }}>Nilai</th>
              <th style={{ width: 100 }}>Predikat</th>
              <th style={{ width: 70 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pra Observasi (Telaah RPP/RPM)</td>
              <td className="center">{data.praObservasi ? fmt(data.praObservasi.tanggal) : "—"}</td>
              <td className="center">{data.praObservasi ? `${data.praObservasi.totalSkor}/180` : "—"}</td>
              <td className="center">{data.praObservasi?.selesai ? data.praObservasi.nilaiAkhir.toFixed(1) : "—"}</td>
              <td className="center">{data.praObservasi?.selesai ? predikatLabel(data.praObservasi.predikat) : "—"}</td>
              <td className="center">{data.praObservasi?.selesai ? "Selesai" : "Belum"}</td>
            </tr>
            <tr>
              <td>Observasi Kelas</td>
              <td className="center">{data.observasiKelas ? fmt(data.observasiKelas.tanggal) : "—"}</td>
              <td className="center">{data.observasiKelas ? `${data.observasiKelas.totalSkor}/${data.observasiKelas.skorMaks}` : "—"}</td>
              <td className="center">{data.observasiKelas?.selesai ? data.observasiKelas.nilaiAkhir.toFixed(1) : "—"}</td>
              <td className="center">{data.observasiKelas?.selesai ? predikatLabel(data.observasiKelas.predikat) : "—"}</td>
              <td className="center">{data.observasiKelas?.selesai ? "Selesai" : "Belum"}</td>
            </tr>
            <tr>
              <td>Pasca Supervisi (Refleksi & RTL)</td>
              <td className="center">{data.pascaSupervisi ? fmt(data.pascaSupervisi.tanggal) : "—"}</td>
              <td className="center">{data.pascaSupervisi ? `${data.pascaSupervisi.totalSkor}/108` : "—"}</td>
              <td className="center">{data.pascaSupervisi?.selesai ? data.pascaSupervisi.nilaiAkhir.toFixed(1) : "—"}</td>
              <td className="center">{data.pascaSupervisi?.selesai ? predikatLabel(data.pascaSupervisi.predikat) : "—"}</td>
              <td className="center">{data.pascaSupervisi?.selesai ? "Selesai" : "Belum"}</td>
            </tr>
            <tr className="baris-total">
              <td colSpan={3}><strong>NILAI AKHIR SUPERVISI</strong></td>
              <td className="center"><strong>{nilaiSiklus !== null ? nilaiSiklus.toFixed(1) : "—"}</strong></td>
              <td className="center"><strong>{predikatLabel(predikatSiklus)}</strong></td>
              <td className="center"><strong>{s.status === "SELESAI" ? "Tuntas" : "Proses"}</strong></td>
            </tr>
          </tbody>
        </table>

        {/* Pra Observasi */}
        <h3 className="judul-bagian">B. Pra Observasi — Telaah RPP/RPM</h3>
        {data.praObservasi ? (
          <>
            <TabelKomponen judul="Pra Observasi" komponen={data.praObservasi.komponen} />
            {data.praObservasi.catatanUmum && (
              <p className="paragraf"><strong>Catatan:</strong> {data.praObservasi.catatanUmum}</p>
            )}
            {data.praObservasi.konferensi.length > 0 && (
              <>
                <p className="sub-judul">Hasil Konferensi Pra-Observasi</p>
                <table className="tabel-cetak">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>No</th>
                      <th>Jawaban Guru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.praObservasi.konferensi.map((k) => (
                      <tr key={k.nomor}>
                        <td className="center">{k.nomor}</td>
                        <td>{k.jawaban ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        ) : (
          <p className="komentar-kosong">Tahap Pra Observasi belum dilaksanakan.</p>
        )}

        {/* Observasi Kelas */}
        <h3 className="judul-bagian">C. Observasi Kelas</h3>
        {data.observasiKelas ? (
          <>
            <TabelKomponen judul="Observasi Kelas" komponen={data.observasiKelas.komponen} />
            {data.observasiKelas.catatanUmum && (
              <p className="paragraf"><strong>Catatan Observasi:</strong> {data.observasiKelas.catatanUmum}</p>
            )}
          </>
        ) : (
          <p className="komentar-kosong">Tahap Observasi Kelas belum dilaksanakan.</p>
        )}

        {/* Pasca Supervisi */}
        <h3 className="judul-bagian">D. Pasca Supervisi — Refleksi & Rencana Tindak Lanjut</h3>
        {data.pascaSupervisi ? (
          <>
            <TabelKomponen judul="Pasca Supervisi" komponen={data.pascaSupervisi.komponen} />
            {data.pascaSupervisi.catatanUmum && (
              <p className="paragraf"><strong>Ringkasan Dialog:</strong> {data.pascaSupervisi.catatanUmum}</p>
            )}
            {rtlSemua.length > 0 && (
              <>
                <p className="sub-judul">Rencana Tindak Lanjut (RTL)</p>
                <table className="tabel-cetak">
                  <thead>
                    <tr>
                      <th style={{ width: 130 }}>Aspek</th>
                      <th>Temuan</th>
                      <th>Rencana Tindak Lanjut</th>
                      <th style={{ width: 80 }}>Target</th>
                      <th style={{ width: 70 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rtlSemua.map((r, i) => (
                      <tr key={i}>
                        <td>{r.aspek}</td>
                        <td>{r.temuan}</td>
                        <td>{r.rencana}</td>
                        <td className="center">
                          {r.target ?? "-"}
                          {r.deadline ? ` (${fmt(r.deadline)})` : ""}
                        </td>
                        <td className="center">
                          {r.statusMonitoring === "SELESAI" ? "Selesai" : r.statusMonitoring === "PROSES" ? "Proses" : "Belum"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        ) : (
          <p className="komentar-kosong">Tahap Pasca Supervisi belum dilaksanakan.</p>
        )}

        {/* Tanda tangan */}
        <div className="ttd">
          <div>
            <p>Mengetahui,</p>
            <p className="kepala">Kepala Sekolah</p>
            <div className="ttd-ruang" />
            <p className="garis">................................................</p>
          </div>
          <div>
            <p>{s.sekolah?.kabupaten ?? "...................."}, {fmt(data.dicetakPada)}</p>
            <p className="kepala">Supervisor</p>
            <div className="ttd-ruang" />
            <p className="garis"><strong><u>{s.supervisor.nama}</u></strong></p>
            <p className="nip-cetak">NIP. {s.supervisor.nip ?? "...................."}</p>
          </div>
        </div>

        <p className="footer-cetak">
          Dicetak dari aplikasi supervisi oleh {data.dicetakOleh} pada {fmt(data.dicetakPada)} — T.A {s.tahunAjaran}{" "}
          {s.semester === "GANJIL" ? "Ganjil" : "Genap"}
        </p>
      </div>
    </div>
  );
}
