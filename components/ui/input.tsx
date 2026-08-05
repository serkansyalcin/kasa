import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-forest",
        "placeholder:text-muted/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple focus-visible:border-apple",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
