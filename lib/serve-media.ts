import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { FOTO_DIR, isVideo, bacaFotoFile } from "@/lib/foto";

// Kirim file media sebagai NextResponse.
// Foto: buffer utuh. Video: streaming dengan dukungan HTTP Range (bisa di-seek).
// cachePublic=true untuk media yang memang ditujukan publik (halaman depan).
export async function kirimMedia(
  req: NextRequest | null,
  storedName: string,
  mimeType: string,
  cachePublic = false
): Promise<NextResponse> {
  const filePath = path.join(FOTO_DIR, storedName);
  const cacheControl = cachePublic ? "public, max-age=86400" : "private, max-age=3600";

  // --- Video: streaming dengan dukungan Range
  if (isVideo(mimeType)) {
    let ukuran: number;
    try {
      ukuran = (await stat(filePath)).size;
    } catch {
      return NextResponse.json({ error: "File media tidak ditemukan di server" }, { status: 404 });
    }

    const range = req?.headers.get("range");
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m && m[1] ? parseInt(m[1], 10) : 0;
      const end = m && m[2] ? Math.min(parseInt(m[2], 10), ukuran - 1) : ukuran - 1;
      if (start >= ukuran || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${ukuran}` },
        });
      }
      const nodeStream = createReadStream(filePath, { start, end });
      return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
        status: 206,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${ukuran}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": cacheControl,
        },
      });
    }

    const nodeStream = createReadStream(filePath);
    return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(ukuran),
        "Accept-Ranges": "bytes",
        "Cache-Control": cacheControl,
      },
    });
  }

  // --- Foto: kirim utuh dari buffer
  const buffer = await bacaFotoFile(storedName);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": cacheControl,
      "Content-Disposition": `inline; filename="dokumentasi-supervisi${mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg"}"`,
    },
  });
}
