import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend = "neutral",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{label}</p>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
                trend === "up" && "text-olive",
                trend === "down" && "text-danger",
                trend === "neutral" && "text-forest",
              )}
            >
              {value}
            </p>
            {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
          </div>
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/25 text-forest">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
