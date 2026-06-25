"use client";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption { value: string; label: string; disabled?: boolean }

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ options, value, onChange, placeholder = "Select…", label, errorMessage, disabled, className }: SelectProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-ink-primary mb-1.5">{label}</label>}
      <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
        <RadixSelect.Trigger className={cn(
          "flex items-center justify-between h-10 w-full rounded-md border bg-white px-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-border-md transition-all",
          errorMessage ? "border-danger" : "border-border",
          disabled && "opacity-50 cursor-not-allowed",
          "data-[placeholder]:text-ink-secondary/60"
        )}>
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon><ChevronDown className="h-4 w-4 text-ink-secondary" /></RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className="z-50 bg-white border border-border rounded-xl shadow-lg overflow-hidden animate-slide-up">
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none hover:bg-surface-50 data-[highlighted]:bg-surface-50 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="ml-auto">
                    <Check className="h-3.5 w-3.5 text-accent" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {errorMessage && <p className="mt-1 text-xs text-danger">{errorMessage}</p>}
    </div>
  );
}
