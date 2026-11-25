/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deploy aman: build ke folder terpisah (NEXT_DIST_DIR=.next-new) lalu ditukar
  // seketika (atomic swap) sebelum pm2 reload — server lama tidak pernah melayani
  // dari folder yang sedang ditimpa (mencegah MODULE_NOT_FOUND setelah deploy).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
