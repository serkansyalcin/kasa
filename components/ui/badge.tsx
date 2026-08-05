import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "income"
  | "expense"
  | "open"
  | "closed"
  | "neutral"
  | "success";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const styles: Record<BadgeVariant, string> = {
  income: "bg-lime/30 text-forest",
  expense: "bg-muted-light text-olive",
  open: "bg-apple/25 text-forest",
  closed: "bg-muted-light text-muted",
  neutral: "bg-muted-light text-muted",
  success: "bg-lime/40 text-forest",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
