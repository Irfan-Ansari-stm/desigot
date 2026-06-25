"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}

const sizeMap = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Modal({ open, onClose, title, description, children, size = "md", footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "bg-white rounded-2xl shadow-xl w-full mx-4",
            "animate-slide-up focus:outline-none",
            sizeMap[size]
          )}
        >
          {(title || description) && (
            <div className="px-6 pt-6 pb-4 border-b border-border">
              {title && (
                <Dialog.Title className="text-lg font-semibold text-ink-primary pr-8">{title}</Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-ink-secondary mt-1">{description}</Dialog.Description>
              )}
            </div>
          )}
          <div className="px-6 py-5">{children}</div>
          {footer && <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">{footer}</div>}
          <Dialog.Close
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-secondary hover:bg-surface-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
