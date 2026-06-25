import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-surface-50 via-surface-100 to-surface-50 animate-skeleton",
        "bg-[length:200%_100%] rounded",
        className
      )}
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn("h-4", i === 0 ? "w-36" : i === 1 ? "w-24" : "w-16")} />
        </td>
      ))}
    </tr>
  );
}
