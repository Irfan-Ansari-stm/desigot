import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none",
  {
    variants: {
      variant: {
        primary:   "bg-brand text-white hover:bg-brand/90 active:bg-brand/80 shadow-sm hover:shadow-brand",
        secondary: "border border-border bg-white text-ink-primary hover:bg-surface-50 active:bg-surface-100",
        ghost:     "text-ink-primary hover:bg-surface-50 active:bg-surface-100",
        danger:    "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
        accent:    "bg-accent text-white hover:bg-accent/90 active:bg-accent/80 shadow-sm hover:shadow-brand",
        link:      "text-accent underline-offset-4 hover:underline h-auto p-0",
        outline:   "border border-accent text-accent hover:bg-accent/5 active:bg-accent/10",
      },
      size: {
        sm:   "h-8 px-3 text-xs rounded-md min-w-[80px]",
        md:   "h-10 px-4 text-sm rounded-md min-w-[100px]",
        lg:   "h-12 px-5 text-base rounded-md min-w-[120px]",
        xl:   "h-14 px-6 text-base rounded-lg min-w-[140px]",
        icon: "h-9 w-9 rounded-md p-0 min-w-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, fullWidth, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
