import type { ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils/cn";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
