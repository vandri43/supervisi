import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Token tidak valid atau sudah kedaluwarsa. Minta tautan reset baru." },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  // Update password + tandai token terpakai, dalam satu transaksi
  await prisma.$transaction([
    prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "Password berhasil diubah. Silakan login dengan password baru." });
}
