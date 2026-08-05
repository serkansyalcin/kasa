import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-forest text-cream hover:bg-olive focus-visible:ring-apple shadow-sm",
  secondary:
    "bg-apple text-forest hover:bg-lime focus-visible:ring-forest shadow-sm",
  ghost:
    "bg-transparent text-forest hover:bg-muted-light focus-visible:ring-apple",
  danger:
    "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
