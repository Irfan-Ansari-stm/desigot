import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "default" | "success" | "warning" | "danger" | "accent";
  className?: string;
  animate?: boolean;
}

const colorMap = {
  default: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger:  "bg-danger",
  accent:  "bg-accent",
};

const getColor = (value: number) => {
  if (value >= 80) return "bg-success";
  if (value >= 50) return "bg-warning";
  return "bg-danger";
};

export function ProgressBar({ value, max = 100, label, showValue, size = "md", color, className, animate = true }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = color ? colorMap[color] : getColor(pct);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-ink-secondary">{label}</span>}
          {showValue && <span className="text-xs font-medium text-ink-primary">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn(
        "w-full bg-surface-100 rounded-full overflow-hidden",
        size === "sm" && "h-1.5",
        size === "md" && "h-2",
        size === "lg" && "h-3",
      )}>
        <div
          className={cn("h-full rounded-full transition-all", animate && "duration-700 ease-out", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
