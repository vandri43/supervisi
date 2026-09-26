// Deteksi provider & id dari URL YouTube / Google Drive untuk thumbnail & embed
export function deteksiProvider(url: string): { provider: string; providerId: string | null } {
  try {
    const u = new URL(url);

    // YouTube: /watch?v=ID, /shorts/ID, /embed/ID, /live/ID, youtu.be/ID
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      const id =
        u.searchParams.get("v") ??
        (u.hostname === "youtu.be" ? u.pathname.slice(1) : null) ??
        url.match(/\/(shorts|embed|live)\/([\w-]{6,})/)?.[2] ??
        null;
      if (id) return { provider: "YOUTUBE", providerId: id };
      return { provider: "YOUTUBE", providerId: null };
    }

    // Google Drive: /file/d/FILE_ID/view... atau id=FILE_ID
    if (u.hostname.includes("drive.google.com")) {
      const id = url.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id");
      return { provider: "GDRIVE", providerId: id };
    }

    return { provider: "LAINNYA", providerId: null };
  } catch {
    return { provider: "LAINNYA", providerId: null };
  }
}
