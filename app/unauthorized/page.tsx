import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Akses Ditolak</h1>
        <p className="text-gray-500 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Link href="/dashboard" className="btn-primary px-6 py-2.5">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

