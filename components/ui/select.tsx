import { cn } from "@/lib/utils/cn";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex h-10 w-full cursor-pointer rounded-xl border border-border bg-surface px-3 text-sm text-forest",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple focus-visible:border-apple",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
