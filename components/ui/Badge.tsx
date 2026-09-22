import clsx from "clsx";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "primary" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-orange-100 text-orange-700",
  danger:  "bg-red-100 text-red-700",
  info:    "bg-cyan-100 text-cyan-700",
  primary: "bg-indigo-100 text-indigo-700",
  default: "bg-gray-100 text-gray-600",
};

export default function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Helper untuk predikat
export function predikatBadge(predikat?: string | null) {
  const map: Record<string, BadgeVariant> = {
    SANGAT_BAIK: "success",
    BAIK: "primary",
    CUKUP: "warning",
    KURANG: "danger",
  };
  const labels: Record<string, string> = {
    SANGAT_BAIK: "Sangat Baik",
    BAIK: "Baik",
    CUKUP: "Cukup",
    KURANG: "Kurang",
  };
  return { variant: map[predikat ?? ""] ?? "default", label: labels[predikat ?? ""] ?? "-" };
}

export function statusBadge(status?: string | null) {
  const map: Record<string, BadgeVariant> = {
    DRAFT: "default",
    PRA_OBSERVASI: "info",
    OBSERVASI: "warning",
    PASCA_SUPERVISI: "primary",
    SELESAI: "success",
  };
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PRA_OBSERVASI: "Pra Observasi",
    OBSERVASI: "Observasi",
    PASCA_SUPERVISI: "Pasca Supervisi",
    SELESAI: "Selesai",
  };
  return { variant: map[status ?? ""] ?? "default", label: labels[status ?? ""] ?? "-" };
}
