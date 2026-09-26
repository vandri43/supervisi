#!/bin/bash
# =============================================================
# Deploy Script - Aplikasi Supervisi Guru
# Jalankan dari laptop (Git Bash / Linux / Mac):
#   bash deploy/deploy.sh
# Ganti host tujuan tanpa mengedit file:
#   VPS_HOST=root@1.2.3.4 bash deploy/deploy.sh
# Lewati build lokal (opsional):
#   SKIP_BUILD=1 bash deploy/deploy.sh
# =============================================================

set -e  # exit on error

# ---- Konfigurasi ----
VPS_HOST="${VPS_HOST:-root@210.79.142.183}"
APP_DIR="${APP_DIR:-/var/www/supervisi-guru}"
APP_NAME="${APP_NAME:-supervisi-guru}"

echo "======================================"
echo "  DEPLOY: Supervisi Guru"
echo "  Target: $VPS_HOST:$APP_DIR"
echo "======================================"

# 1. Build lokal dulu (validasi sebelum upload)
if [ "${SKIP_BUILD:-0}" = "1" ]; then
  echo ""
  echo "[1/5] Lewati build lokal (SKIP_BUILD=1)"
else
  echo ""
  echo "[1/5] Building project lokal..."
  npm run build
  echo "      Build selesai ✓"
fi

# 2. Upload source ke VPS
echo ""
echo "[2/5] Upload source ke VPS..."
ssh "$VPS_HOST" "mkdir -p $APP_DIR"
if command -v rsync >/dev/null 2>&1; then
  # Linux/Mac: rsync lebih cepat (hanya kirim file berubah)
  rsync -az --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '*.log' \
    ./ "$VPS_HOST:$APP_DIR/"
else
  # Windows/Git Bash: fallback tar lewat koneksi SSH
  echo "      (rsync tidak tersedia, memakai tar+ssh)"
  tar -czf - \
    --exclude='./node_modules' \
    --exclude='./.next' \
    --exclude='./.git' \
    --exclude='./.env' \
    --exclude='./deploy/.env.production' \
    --exclude='./.agents' \
    --exclude='./.claude' \
    --exclude='./.windsurf' \
    --exclude='./.freebuff' \
    --exclude='*.log' \
    ./ | ssh "$VPS_HOST" "tar -xzf - --no-same-owner --no-same-permissions -C $APP_DIR"
fi
echo "      Upload selesai ✓"

# 3. Siapkan .env di VPS (TIDAK menimpa yang sudah ada)
echo ""
echo "[3/5] Cek konfigurasi .env di VPS..."
if ssh "$VPS_HOST" "test -f $APP_DIR/.env"; then
  echo "      .env sudah ada di VPS — dipakai apa adanya ✓"
elif [ -f deploy/.env.production ]; then
  scp deploy/.env.production "$VPS_HOST:$APP_DIR/.env"
  echo "      .env diunggah dari deploy/.env.production ✓"
else
  echo "      PERINGATAN: .env belum ada & deploy/.env.production tidak ditemukan!"
  echo "      Buat manual di VPS: nano $APP_DIR/.env (lihat PANDUAN Bagian 5)"
fi

# 4. Install dependencies & build di VPS
echo ""
echo "[4/5] Install & build di VPS (beberapa menit)..."
ssh "$VPS_HOST" "cd $APP_DIR && \
  npm install --production=false && \
  npx prisma generate && \
  npx prisma db push && \
  npm run build"
echo "      Install & build selesai ✓"

# 5. Restart aplikasi dengan PM2
echo ""
echo "[5/5] Restart aplikasi dengan PM2..."
ssh "$VPS_HOST" "cd $APP_DIR && \
  (pm2 restart $APP_NAME 2>/dev/null || pm2 start npm --name $APP_NAME -- start) && \
  pm2 save"
echo "      PM2 restart selesai ✓"

echo ""
echo "======================================"
echo "  DEPLOY SELESAI!"
echo "  Cek aplikasi di domain Anda"
echo "======================================"
