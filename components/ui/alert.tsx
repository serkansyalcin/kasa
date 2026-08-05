import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
};

const styles: Record<AlertVariant, string> = {
  info: "border-apple/40 bg-lime/15 text-forest",
  success: "border-apple/50 bg-lime/25 text-forest",
  warning: "border-olive/40 bg-cream text-olive",
  error: "border-danger/30 bg-danger-soft text-danger",
};

const icons: Record<AlertVariant, ReactNode> = {
  info: <Info className="h-4 w-4 shrink-0" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  warning: <AlertCircle className="h-4 w-4 shrink-0" />,
  error: <AlertCircle className="h-4 w-4 shrink-0" />,
};

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        styles[variant],
        className,
      )}
      {...props}
    >
      {icons[variant]}
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? (
          <div className={cn(title && "mt-0.5 opacity-90")}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}
