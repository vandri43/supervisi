"use client";

// Komponen chart halaman login — dimuat LAZY (dynamic import) dari page login
// agar bundle recharts (~130KB) tidak membloki tampilan awal halaman.

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface GuruStat {
  label: string;
  nilai: number | null;
  predikat: string | null;
}

interface DistribusiItem {
  predikat: string;
  label: string;
  jumlah: number;
}

interface GrafikLoginProps {
  perGuru: GuruStat[];
  distribusi: DistribusiItem[];
  rataTahap: { pra: number | null; observasi: number | null; pasca: number | null };
}

const WARNA_PREDIKAT: Record<string, string> = {
  SANGAT_BAIK: "#2dce89",
  BAIK: "#5e72e4",
  CUKUP: "#fb6340",
  KURANG: "#f5365c",
};

export default function GrafikLogin({ perGuru, distribusi, rataTahap }: GrafikLoginProps) {
  return (
    <div className="space-y-5">
      {/* Grafik batang nilai per guru (anonim) */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <p className="text-white/60 text-xs font-semibold mb-2">Nilai Hasil Supervisi per Guru</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perGuru} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                contentStyle={{
                  background: "#16213e",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                formatter={(value) => [`${value ?? 0} / 100`, "Nilai"]}
              />
              <Bar dataKey="nilai" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {perGuru.map((g) => (
                  <Cell key={g.label} fill={WARNA_PREDIKAT[g.predikat ?? ""] ?? "#5e72e4"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rata-rata per tahap + distribusi predikat */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-white/60 text-xs font-semibold mb-3">Rata-rata per Tahap</p>
          <div className="space-y-3">
            {([
              ["Pra-Observasi", rataTahap.pra],
              ["Observasi Kelas", rataTahap.observasi],
              ["Pasca Supervisi", rataTahap.pasca],
            ] as const).map(([tahap, nilai]) => (
              <div key={tahap}>
                <div className="flex justify-between text-[11px] text-white/50 mb-1">
                  <span>{tahap}</span>
                  <span className="text-white/80 font-semibold">{nilai != null ? nilai.toFixed(1) : "—"}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${nilai ?? 0}%`,
                      background: "linear-gradient(90deg, #5e72e4, #825ee4)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-white/60 text-xs font-semibold mb-2">Distribusi Predikat</p>
          <div className="flex items-center gap-3">
            <div className="h-28 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribusi.filter((d) => d.jumlah > 0)}
                    dataKey="jumlah"
                    nameKey="label"
                    innerRadius={30}
                    outerRadius={54}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {distribusi
                      .filter((d) => d.jumlah > 0)
                      .map((d) => (
                        <Cell key={d.predikat} fill={WARNA_PREDIKAT[d.predikat]} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#16213e",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5 text-xs min-w-0">
              {distribusi.map((d) => (
                <li key={d.predikat} className="flex items-center gap-2 text-white/70">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: WARNA_PREDIKAT[d.predikat], opacity: d.jumlah > 0 ? 1 : 0.25 }}
                  />
                  <span className="truncate">{d.label}</span>
                  <span className="text-white font-semibold ml-auto pl-2">{d.jumlah}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
