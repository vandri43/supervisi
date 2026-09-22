import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const sekolah1 = await prisma.sekolah.upsert({
    where: { npsn: "12345678" },
    update: {},
    create: {
      nama: "SMK Negeri 1 Contoh",
      npsn: "12345678",
      alamat: "Jl. Pendidikan No. 1",
      kecamatan: "Kecamatan Contoh",
      kabupaten: "Kabupaten Contoh",
      provinsi: "Jawa Tengah",
      telepon: "0281-123456",
      email: "smkn1contoh@example.com",
    },
  });

  await prisma.sekolah.upsert({
    where: { npsn: "87654321" },
    update: {},
    create: {
      nama: "SMK Negeri 2 Contoh",
      npsn: "87654321",
      alamat: "Jl. Belajar No. 2",
      kecamatan: "Kecamatan Lain",
      kabupaten: "Kabupaten Contoh",
      provinsi: "Jawa Tengah",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@supervisi.id" },
    update: {},
    create: {
      nama: "Administrator",
      email: "admin@supervisi.id",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
      jabatan: "Administrator Sistem",
      aktif: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "supervisor@supervisi.id" },
    update: {},
    create: {
      nama: "Drs. Budi Santoso, M.Pd",
      email: "supervisor@supervisi.id",
      password: await bcrypt.hash("super123", 12),
      role: "SUPERVISOR",
      nip: "196501011990031001",
      jabatan: "Pengawas Sekolah",
      sekolahId: sekolah1.id,
      aktif: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "guru@supervisi.id" },
    update: {},
    create: {
      nama: "Siti Rahayu, S.Pd",
      email: "guru@supervisi.id",
      password: await bcrypt.hash("guru123", 12),
      role: "GURU",
      nip: "198501012010012001",
      jabatan: "Guru Mata Pelajaran",
      mapel: "Desain Komunikasi Visual",
      sekolahId: sekolah1.id,
      aktif: true,
    },
  });

  console.log("✅ Seeding selesai!");
  console.log("  Admin      : admin@supervisi.id / admin123");
  console.log("  Supervisor : supervisor@supervisi.id / super123");
  console.log("  Guru       : guru@supervisi.id / guru123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
