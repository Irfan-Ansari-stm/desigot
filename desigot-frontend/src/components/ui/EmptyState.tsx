import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {icon && (
        <div className="w-14 h-14 bg-surface-50 rounded-2xl flex items-center justify-center text-ink-secondary mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
      {description && <p className="text-sm text-ink-secondary mt-1 max-w-sm">{description}</p>}
      {action && (
        <Button variant="primary" size="md" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
