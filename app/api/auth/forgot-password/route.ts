import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Selalu balas sukses agar tidak membocorkan email mana yang terdaftar
  const genericResponse = {
    message:
      "Jika email terdaftar, tautan reset password telah dibuat. Hubungi administrator untuk mendapatkan token.",
  };

  if (!user || !user.aktif) {
    return NextResponse.json(genericResponse);
  }

  // Hapus token lama yang masih aktif untuk email ini
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt },
  });

  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ...genericResponse,
    // Di development, kembalikan link supaya bisa diuji tanpa layanan email.
    // Di production, kirim link ini via email (integrasi SMTP belum tersedia).
    ...(isDev ? { resetUrl: `/reset-password?token=${token}` } : {}),
  });
}
