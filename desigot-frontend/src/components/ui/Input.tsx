import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  prefix?: React.ReactNode | string;
  suffix?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, errorMessage, prefix, suffix, wrapperClassName, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("w-full", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-primary mb-1.5">
            {label}
            {props.required && <span className="text-accent ml-0.5">*</span>}
          </label>
        )}
        <div className={cn(
          "flex items-center gap-2 h-10 w-full rounded-md border bg-white px-3 text-sm transition-all",
          "focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-border-md",
          errorMessage ? "border-danger focus-within:ring-danger/20" : "border-border",
          props.disabled && "opacity-50 cursor-not-allowed bg-surface-50"
        )}>
          {prefix && <span className="text-ink-secondary shrink-0">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 bg-transparent outline-none placeholder:text-ink-secondary/60 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
          {suffix && <span className="text-ink-secondary shrink-0">{suffix}</span>}
        </div>
        {errorMessage && <p className="mt-1 text-xs text-danger">{errorMessage}</p>}
        {helperText && !errorMessage && <p className="mt-1 text-xs text-ink-secondary">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, errorMessage, wrapperClassName, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("w-full", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-primary mb-1.5">
            {label}
            {props.required && <span className="text-accent ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "flex w-full rounded-md border bg-white px-3 py-2 text-sm transition-all resize-none",
            "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-border-md",
            "placeholder:text-ink-secondary/60 disabled:cursor-not-allowed disabled:opacity-50",
            errorMessage ? "border-danger" : "border-border",
            className
          )}
          {...props}
        />
        {errorMessage && <p className="mt-1 text-xs text-danger">{errorMessage}</p>}
        {helperText && !errorMessage && <p className="mt-1 text-xs text-ink-secondary">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input };
