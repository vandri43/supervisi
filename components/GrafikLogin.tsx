"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
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

export default function GrafikLogin({ perGuru }: GrafikLoginProps) {
  return (
    <div className="h-64">
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
          <Bar dataKey="nilai" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {perGuru.map((g) => (
              <Cell key={g.label} fill={WARNA_PREDIKAT[g.predikat ?? ""] ?? "#5e72e4"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
