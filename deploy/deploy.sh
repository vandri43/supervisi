#!/bin/bash
# =============================================================
# Deploy Script v2 - Aplikasi Supervisi Guru
# Perbaikan: build di folder TERPISAH lalu atomic swap, sehingga
# server yang sedang melayani tidak pernah membaca folder .next
# yang sedang ditimpa (penyebab hang / MODULE_NOT_FOUND setelah deploy).
#
# Jalankan dari laptop:
#   bash deploy/deploy.sh
# Ganti host tanpa mengedit file:
#   VPS_HOST=root@1.2.3.4 bash deploy/deploy.sh
# =============================================================

set -e

VPS_HOST="${VPS_HOST:-root@10.10.102.15}"
APP_DIR="${APP_DIR:-/var/www/supervisi-guru}"
APP_NAME="${APP_NAME:-supervisi-guru}"

echo "======================================"
echo "  DEPLOY v2 (atomic swap): Supervisi Guru"
echo "  Target: $VPS_HOST:$APP_DIR"
echo "======================================"

# 1. Upload source (tanpa node_modules/.next/.git/.env)
echo ""
echo "[1/5] Upload source ke VPS..."
tar -czf - \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./.next-new' \
  --exclude='./.git' \
  --exclude='./.env' \
  --exclude='./deploy/.env.production' \
  --exclude='./.agents' \
  --exclude='./.claude' \
  --exclude='./.windsurf' \
  --exclude='./.freebuff' \
  --exclude='*.log' \
  ./ | ssh "$VPS_HOST" "tar -xzf - --no-same-owner --no-same-permissions -C $APP_DIR"
echo "      Upload selesai ✓"

# 2. Install & generate (aman saat app lama masih jalan)
# db push: menerapkan perubahan schema (tabel baru) — aman, gagal otomatis bila butuh data-loss
echo ""
echo "[2/5] Install dependencies, generate Prisma client & db push..."
ssh "$VPS_HOST" "cd $APP_DIR && npm install --production=false && node node_modules/prisma/build/index.js generate && node node_modules/prisma/build/index.js db push --skip-generate"
echo "      Selesai ✓"

# 3. BUILD KE FOLDER TERPISAH (.next-new) — app lama tetap melayani utuh
echo ""
echo "[3/5] Build ke folder terpisah (.next-new) — app lama tetap melayani..."
ssh "$VPS_HOST" "cd $APP_DIR && rm -rf .next-new && NEXT_DIST_DIR=.next-new node node_modules/next/dist/bin/next build"
echo "      Build selesai ✓"

# 4. ATOMIC SWAP: ganti .next sekaligus, lalu reload (zero-downtime)
echo ""
echo "[4/5] Atomic swap .next-new -> .next & reload PM2..."
ssh "$VPS_HOST" "cd $APP_DIR && \
  rm -rf .next-old && \
  mv .next .next-old 2>/dev/null || true && \
  mv .next-new .next && \
  (pm2 reload $APP_NAME --update-env 2>/dev/null || pm2 restart $APP_NAME --update-env) && \
  rm -rf .next-old"
echo "      Swap & reload selesai ✓"

# 5. Verifikasi
echo ""
echo "[5/5] Verifikasi..."
ssh "$VPS_HOST" "sleep 2 && pm2 list | grep $APP_NAME && curl -s -o /dev/null -w 'Health check /login: HTTP %{http_code} (%{time_total}s)\n' http://127.0.0.1:3000/login"

echo ""
echo "======================================"
echo "  DEPLOY SELESAI (tanpa downtime, tanpa hang!)"
echo "======================================"
