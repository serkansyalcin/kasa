import { cn } from "@/lib/utils/cn";
import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-forest",
        "placeholder:text-muted/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple focus-visible:border-apple",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
