"use client";

import { useEffect, useState } from "react";

export interface AppSettings {
  appName: string;
  appTagline: string;
  logoUrl: string | null;
  footerText: string | null;
  tahunAjaran: string;
  semester: string;
}

const DEFAULTS: AppSettings = {
  appName: "Supervisi",
  appTagline: "Pembelajaran Mendalam",
  logoUrl: null,
  footerText: null,
  tahunAjaran: "2025/2026",
  semester: "GANJIL",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: AppSettings) => setSettings(data))
      .catch(() => {});
  }, []);

  return { settings };
}
