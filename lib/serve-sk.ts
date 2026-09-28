import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { SK_DIR } from "@/lib/foto";

// Kirim file SK sebagai NextResponse.
// PDF dikirim inline (Content-Disposition: inline) sehingga terbuka otomatis
// di tab/iframe browser; gambar juga inline agar bisa ditampilkan sebagai <img>.
export async function kirimSk(
  storedName: string,
  mimeType: string
): Promise<NextResponse> {
  // storedName dibuat sistem (bukan user) tapi tetap divalidasi ketat
  if (!/^[a-zA-Z0-9._-]+$/.test(storedName) || storedName.includes("..")) {
    return NextResponse.json({ error: "Nama file tidak valid" }, { status: 400 });
  }

  const buffer = await readFile(path.join(SK_DIR, storedName));
  const ext = mimeType === "application/pdf" ? ".pdf" : mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": `inline; filename="dokumen-sk${ext}"`,
    },
  });
}
