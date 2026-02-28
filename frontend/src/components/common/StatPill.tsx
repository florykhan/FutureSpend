import { cn } from "@/lib/utils";

interface StatPillProps {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variants = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
};

export function StatPill({ label, value, variant = "default", className }: StatPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      <span className="text-slate-500">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
