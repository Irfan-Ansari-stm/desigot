"use client";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error:   <XCircle     className="h-4 w-4 text-danger" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  info:    <Info        className="h-4 w-4 text-info" />,
};

const colors = {
  success: "border-l-success",
  error:   "border-l-danger",
  warning: "border-l-warning",
  info:    "border-l-info",
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 bg-white border border-border rounded-lg shadow-lg p-4",
            "border-l-4 animate-slide-up",
            colors[t.type]
          )}
        >
          {icons[t.type]}
          <p className="flex-1 text-sm text-ink-primary font-medium">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-ink-secondary hover:text-ink-primary ml-1 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
