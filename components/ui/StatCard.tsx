import clsx from "clsx";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg?: string;   // gradient class or inline style
  trend?: {
    value: string;
    positive?: boolean;
  };
}

const gradients: Record<string, string> = {
  primary: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)",
  success: "linear-gradient(87deg, #2dce89 0, #2dcecc 100%)",
  warning: "linear-gradient(87deg, #fb6340 0, #fbb140 100%)",
  danger:  "linear-gradient(87deg, #f5365c 0, #f56036 100%)",
  info:    "linear-gradient(87deg, #11cdef 0, #1171ef 100%)",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "primary",
  trend,
}: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-800 leading-tight">{value}</h3>
          {trend && (
            <p className={clsx("text-xs mt-1 font-medium", trend.positive ? "text-green-500" : "text-red-400")}>
              <span>{trend.positive ? "▲" : "▼"}</span>{" "}
              <span>{trend.value}</span>
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-4"
          style={{ background: gradients[iconBg] ?? gradients.primary }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
