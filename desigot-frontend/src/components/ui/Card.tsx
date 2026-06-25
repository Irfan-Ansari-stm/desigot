import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ className, hover, padding = "md", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-border rounded-xl shadow-sm",
        hover && "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",
        padding === "none" && "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-ink-primary", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-border flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}

// Stats KPI card
interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  icon?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function StatCard({ label, value, delta, icon, className, loading }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-secondary font-medium">{label}</p>
          {loading ? (
            <div className="h-8 w-24 bg-surface-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-ink-primary mt-1">{value}</p>
          )}
          {delta !== undefined && !loading && (
            <p className={cn("text-xs mt-1 font-medium", delta >= 0 ? "text-success" : "text-danger")}>
              {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last period
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-surface-50 rounded-lg text-ink-secondary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
