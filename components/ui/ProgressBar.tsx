import clsx from "clsx";

interface ProgressBarProps {
  value: number;   // 0-100
  color?: "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  showLabel?: boolean;
  label?: string;
}

const colors: Record<string, string> = {
  primary: "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)",
  success: "linear-gradient(87deg, #2dce89 0, #2dcecc 100%)",
  warning: "linear-gradient(87deg, #fb6340 0, #fbb140 100%)",
  danger:  "linear-gradient(87deg, #f5365c 0, #f56036 100%)",
  info:    "linear-gradient(87deg, #11cdef 0, #1171ef 100%)",
};

function getColor(value: number): string {
  if (value >= 91) return "success";
  if (value >= 81) return "primary";
  if (value >= 71) return "warning";
  return "danger";
}

export default function ProgressBar({
  value,
  color,
  size = "sm",
  showLabel = false,
  label,
}: ProgressBarProps) {
  const resolvedColor = color ?? getColor(value);

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-500">{label}</span>}
          {showLabel && <span className="text-xs font-semibold text-gray-600">{value.toFixed(1)}%</span>}
        </div>
      )}
      <div className={clsx(
        "w-full rounded-full bg-gray-100 overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2.5"
      )}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: colors[resolvedColor] ?? colors.primary,
          }}
        />
      </div>
    </div>
  );
}
