import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({ rating, max = 5, size = "sm", showValue, count, interactive, onChange }: StarRatingProps) {
  const sz = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" }[size];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const half   = !filled && i < rating;
          return (
            <button
              key={i}
              type={interactive ? "button" : undefined}
              onClick={() => interactive && onChange?.(i + 1)}
              className={cn(!interactive && "cursor-default", interactive && "hover:scale-110 transition-transform")}
            >
              <Star
                className={cn(sz, filled || half ? "text-amber-400 fill-amber-400" : "text-border")}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-medium text-ink-primary", size === "sm" ? "text-xs" : "text-sm")}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-ink-secondary">({count})</span>
      )}
    </div>
  );
}
