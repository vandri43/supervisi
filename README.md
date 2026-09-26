# Sistem Supervisi Guru

Aplikasi web manajemen **supervisi pembelajaran mendalam** (pra-observasi → observasi kelas → pasca supervisi → RTL) berbasis Next.js 14 App Router + Prisma + MySQL. Dipakai oleh ADMIN, SUPERVISOR, dan GURU.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![DB](https://img.shields.io/badge/MySQL-8-blue) ![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)

---

## ✨ Fitur

| Modul | Keterangan |
|---|---|
| 🔐 Autentikasi | Login berbasis role (ADMIN / SUPERVISOR / GURU), JWT session 8 jam, lupa & reset password via email |
| 🗓️ Siklus Supervisi | Alur bertahap: Draft → Pra Observasi → Observasi Kelas → Pasca Supervisi → Selesai |
| 📋 Instrumen **Dinamis** | Admin dapat **tambah / edit / hapus** komponen, indikator, dimensi, tag PM, dan pertanyaan konferensi — skor maksimum dihitung otomatis dari jumlah indikator |
| 📎 Bukti Tugas Guru | Guru mengumpulkan link (Google Drive RPP/RPM, Analisis CP/Silabus, RPE, video YouTube) **atau upload file** foto/video; supervisor memverifikasi (Terima/Tolak + catatan) |
| 📷 Dokumentasi Supervisi | Supervisor mengunggah **foto & video** (kompres otomatis < 1 MB, video streaming HTTP Range) atau link YouTube/Drive sebagai bukti otentik |
| 🖼️ Galeri Publik | Foto/video dokumentasi tampil di halaman login — bukti guru hanya tampil setelah diverifikasi; nama guru tidak diekspos |
| 📊 Statistik Publik | Grafik hasil supervisi di halaman login dengan **nama guru dianonimkan** (Guru 1, Guru 2, …) |
| 🔔 Notifikasi Real | Lonceng notifikasi + badge, polling hemat (pause saat tab tidak aktif) |
| 📝 RTL & Monitoring | Rencana Tindak Lanjut per aspek, guru mengisi progres, supervisor memantau |
| 🖨️ Cetak Laporan | Laporan siklus siap cetak + rekap statistik per tahun ajaran |
| ⚙️ Branding | Nama aplikasi, tagline, logo, tahun ajaran & semester aktif diatur admin |
| 📱 Responsive | Sidebar drawer mobile, layout adaptif |

---

## 🧱 Teknologi

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS** + lucide-react (ikon) + recharts (grafik)
- **Prisma 5** ORM + **MySQL 8**
- **NextAuth** (credentials provider, JWT)
- **bcryptjs** (hash password), **exceljs** (import data)
- **PM2** (process manager, cluster mode) + Nginx/Caddy reverse proxy

---

## 📁 Struktur Proyek

```
supervisi-guru/
├── app/
│   ├── api/                        # REST API (App Router route handlers)
│   │   ├── admin/instrumen/        # CRUD instrumen dinamis (ADMIN)
│   │   ├── auth/                   # forgot-password, reset-password (next-auth di /api/auth)
│   │   ├── bukti/                  # bukti tugas guru (list/add/edit/verifikasi/delete)
│   │   ├── dashboard/              # agregat ringkasan per role
│   │   ├── foto/[id]/              # serve & hapus media (auth, video streaming Range)
│   │   ├── guru/                   # hasil supervisi & RTL (guru login)
│   │   ├── laporan/                # rekap supervisi (supervisor/admin)
│   │   ├── notifikasi/             # list & tandai dibaca
│   │   ├── public/statistik/       # statistik publik halaman login (anonim, cache 60s)
│   │   ├── public/galeri/          # galeri publik halaman login (cache 60s)
│   │   ├── public/media/[id]/      # serve media publik (supervisor upload / guru terverifikasi)
│   │   ├── settings/               # branding & tahun ajaran (GET publik, PUT admin)
│   │   ├── siklus/                 # CRUD siklus + [id]/[stage] (isi nilai) + [id]/cetak + [id]/foto + [id]/media-link
│   │   └── users/                  # kelola pengguna (admin)
│   ├── admin/                      # halaman ADMIN (sekolah, users, instrumen, settings)
│   ├── supervisor/                 # halaman SUPERVISOR (siklus, pra-observasi, observasi, pasca)
│   ├── guru/                       # halaman GURU (hasil, rtl, bukti)
│   ├── login/                      # halaman depan: login + statistik anonim + galeri publik
│   ├── laporan/                    # rekap & statistik
│   └── layout.tsx                  # root layout + metadata viewport
├── components/
│   ├── layout/                     # DashboardLayout, Sidebar (drawer mobile), Topbar (notifikasi)
│   ├── ui/                         # Badge, ProgressBar
│   ├── BrandHeader.tsx             # logo+nama dari settings
│   ├── BuktiTugasPanel.tsx         # panel bukti (list + verifikasi) — reusable
│   ├── FotoDokumentasi.tsx         # galeri media (upload kompres <1MB, video, link YT/Drive)
│   └── GrafikLogin.tsx             # chart halaman login (lazy-loaded)
├── lib/
│   ├── auth.ts                     # konfigurasi NextAuth
│   ├── prisma.ts                   # singleton PrismaClient
│   ├── settings.ts                 # get/update settings aplikasi
│   ├── notifikasi.ts               # kirim notifikasi (single/batch/ke pengawas)
│   ├── foto.ts                     # penyimpanan media (validasi mime, simpan/hapus/baca)
│   ├── serve-media.ts              # kirim media + video streaming HTTP Range
│   ├── media-link.ts               # deteksi provider YouTube/Google Drive
│   ├── instrumen-db.ts             # instrumen dinamis: auto-seed, cache, hitung nilai
│   └── instrumen/                  # definisi awal instrumen (pra 40, observasi 38, pasca 27 indikator)
├── prisma/
│   ├── schema.prisma               # skema lengkap (User, Siklus, instrumen dinamis, Bukti, FotoSupervisi, MediaLink, Notifikasi, dst)
│   └── seed.ts                     # akun awal
├── deploy/deploy.sh                # script deploy tar+ssh ke VPS
├── middleware.ts                   # proteksi route per role
└── PANDUAN-INSTALASI-VPS.txt       # panduan instalasi VPS (versi teks)
```

---

## 🚀 Instalasi Lokal (Development)

### Prasyarat
- Node.js ≥ 18
- MySQL ≥ 8 berjalan lokal
- Git

### Langkah

```bash
# 1. Clone
git clone https://github.com/vandri43/supervisi.git
cd supervisi

# 2. Install dependencies
npm install

# 3. Siapkan environment
cp .env.example .env
# lalu edit .env:
#   DATABASE_URL="mysql://root:PASSWORD@localhost:3306/supervisi_guru"
#   NEXTAUTH_URL="http://localhost:3000"
#   NEXTAUTH_SECRET="ganti-dengan-string-acak-min-32-karakter"

# 4. Buat database & tabel
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS supervisi_guru CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npx prisma db push
npx prisma generate

# 5. Isi akun awal (admin@supervisi.id / admin123)
npm run db:seed

# 6. Jalankan
npm run dev
# buka http://localhost:3000
```

> Setelah login sebagai admin, segera ganti password default di menu profil.

---

## 🖥️ Instalasi di VPS (Produksi)

Panduan lengkap langkah demi langkah tersedia di [`PANDUAN-INSTALASI-VPS.txt`](./PANDUAN-INSTALASI-VPS.txt). Ringkasannya:

```bash
# Di VPS (Ubuntu):
apt update && apt install -y nginx mysql-server pm2   # + Node 18 via nodesource

# Database
mysql -e "CREATE DATABASE supervisi_guru CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER 'supervisi'@'localhost' IDENTIFIED BY 'PASSWORD_KUAT';"
mysql -e "GRANT ALL ON supervisi_guru.* TO 'supervisi'@'localhost'; FLUSH PRIVILEGES;"

# Kode
cd /var/www && git clone https://github.com/vandri43/supervisi.git supervisi-guru
cd supervisi-guru

# Environment (JANGAN commit file ini!)
cat > .env << 'EOF'
DATABASE_URL="mysql://supervisi:PASSWORD_KUAT@localhost:3306/supervisi_guru"
NEXTAUTH_URL="https://domain-anda.com"
NEXTAUTH_SECRET="string-acak-min-32-karakter"
EOF

# Build & migrate
npm install --production=false
npx prisma db push && npx prisma generate
npm run build

# Jalankan dengan PM2 (cluster 2 core, zero-downtime reload)
pm2 start node_modules/next/dist/bin/next --name supervisi-guru -i 2 -- start
pm2 save && pm2 startup

# Reverse proxy (Nginx ATAU Caddy) → proxy_pass http://localhost:3000
# Penting untuk upload: client_max_body_size 60m;  (Nginx)
```

Deploy berikutnya cukup: `bash deploy/deploy.sh` (atau `VPS_HOST=root@IP bash deploy/deploy.sh`).

---

## ⚙️ Optimasi Performa yang Sudah Diterapkan

- **Lazy-load recharts** — bundle login 228 kB → 114 kB (chart dimuat terpisah)
- **Cluster PM2 2 instance** — memakai semua core CPU, `pm2 reload` tanpa downtime
- **Cache in-memory 60 dtk** — API publik (statistik & galeri) tidak memukul DB berulang
- **Polling notifikasi pintar** — berhenti saat tab tidak aktif
- **Kompresi foto di browser** — foto HP 3–5 MB dikompres < 1 MB sebelum dikirim
- **Video streaming HTTP Range** — video tidak diunduh utuh saat dipratinjau
- **Cache aset immutable** — file `.next/static` di-cache browser 1 tahun

---

## 🔒 Keamanan

- Semua file/endpoint sensitif butuh login; guru hanya melihat data siklusnya sendiri
- Media disimpan di luar `public/` dengan nama acak (anti path-traversal), diakses lewat API ber-auth
- `.env` di-gitignore — **jangan pernah commit** berisi password
- Galeri publik hanya mengekspos: media supervisor + bukti guru berstatus DITERIMA, tanpa nama pribadi

## 📄 Lisensi

Bebas digunakan dan dimodifikasi untuk kebutuhan internal sekolah.
