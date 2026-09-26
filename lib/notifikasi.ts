import { prisma } from "@/lib/prisma";

interface NotifInput {
  userId: string;
  judul: string;
  pesan: string;
  tipe?: "info" | "sukses" | "rtl" | "supervisi";
  link?: string;
}

// Kirim satu notifikasi ke satu user
export async function kirimNotifikasi(input: NotifInput) {
  try {
    await prisma.notifikasi.create({
      data: {
        userId: input.userId,
        judul: input.judul.slice(0, 200),
        pesan: input.pesan.slice(0, 500),
        tipe: input.tipe ?? "info",
        link: input.link?.slice(0, 255),
      },
    });
  } catch (e) {
    // Notifikasi tidak boleh membatalkan aksi utama
    console.error("Gagal mengirim notifikasi:", e);
  }
}

// Batas aman jumlah penerima per batch
const MAX_PENERIMA = 200;

// Kirim notifikasi ke banyak user sekaligus
export async function kirimNotifikasiBatch(userIds: string[], data: Omit<NotifInput, "userId">) {
  const unik = Array.from(new Set(userIds)).filter(Boolean).slice(0, MAX_PENERIMA);
  if (unik.length === 0) return;
  try {
    await prisma.notifikasi.createMany({
      data: unik.map((userId) => ({
        userId,
        judul: data.judul.slice(0, 200),
        pesan: data.pesan.slice(0, 500),
        tipe: data.tipe ?? "info",
        link: data.link?.slice(0, 255),
      })),
    });
  } catch (e) {
    console.error("Gagal mengirim notifikasi batch:", e);
  }
}

// Kirim ke semua ADMIN + SUPERVISOR aktif
export async function kirimKePengawas(data: Omit<NotifInput, "userId">) {
  const pengawas = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERVISOR"] }, aktif: true },
    select: { id: true },
  });
  await kirimNotifikasiBatch(pengawas.map((u) => u.id), data);
}
