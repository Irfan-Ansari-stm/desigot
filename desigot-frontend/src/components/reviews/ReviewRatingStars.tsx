"use strict";
import React from "react";
import { Star, StarHalf } from "lucide-react";

interface ReviewRatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showScore?: boolean;
  scoreClass?: string;
}

export const ReviewRatingStars: React.FC<ReviewRatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = "sm",
  showScore = false,
  scoreClass = "text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1.5"
}) => {
  const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const starSize = sizeMap[size];
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className="flex items-center gap-0.5" title={`${rating.toFixed(2)} out of 5 stars`}>
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, idx) => {
          const starVal = idx + 1;
          if (rating >= starVal) {
            return (
              <Star
                key={idx}
                className={`${starSize} fill-amber-400 text-amber-400`}
              />
            );
          } else if (rounded === starVal - 0.5) {
            return (
              <StarHalf
                key={idx}
                className={`${starSize} fill-amber-400 text-amber-400`}
              />
            );
          } else {
            return (
              <Star
                key={idx}
                className={`${starSize} text-slate-300 dark:text-slate-600`}
              />
            );
          }
        })}
      </div>
      {showScore && <span className={scoreClass}>{Number(rating).toFixed(1)}</span>}
    </div>
  );
};

export const RatingHistogramBar: React.FC<{
  star: number;
  count: number;
  total: number;
}> = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 font-medium text-slate-600 dark:text-slate-300 flex items-center justify-end gap-1">
        {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
      </span>
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-slate-500 dark:text-slate-400">
        {pct}%
      </span>
      <span className="w-10 text-right text-slate-400 dark:text-slate-500 text-[11px]">
        ({count})
      </span>
    </div>
  );
};
