"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

interface Brand {
  appName: string;
  appTagline: string;
  logoUrl: string | null;
}

export default function BrandHeader({ large = true }: { large?: boolean }) {
  const [brand, setBrand] = useState<Brand>({
    appName: "Supervisi Guru",
    appTagline: "Sistem Supervisi Pembelajaran Mendalam",
    logoUrl: null,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Brand) => setBrand(data))
      .catch(() => {});
  }, []);

  return (
    <div className="text-center mb-8">
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logoUrl}
          alt={brand.appName}
          className={`${large ? "w-16 h-16" : "w-9 h-9"} rounded-2xl object-cover mx-auto ${large ? "mb-4" : ""} shadow-xl`}
        />
      ) : (
        <div
          className={`${large ? "w-16 h-16" : "w-9 h-9"} rounded-2xl flex items-center justify-center mx-auto ${large ? "mb-4" : ""} shadow-xl`}
          style={{ background: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)" }}
        >
          <ClipboardList className={`${large ? "w-8 h-8" : "w-5 h-5"} text-white`} />
        </div>
      )}
      <h1 className={`text-white font-bold ${large ? "text-2xl" : "text-sm"}`}>{brand.appName}</h1>
      {large && <p className="text-white/50 text-sm mt-1">{brand.appTagline}</p>}
    </div>
  );
}
