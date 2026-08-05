import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import type { ReactNode } from "react";

type GoalProgressProps = {
  label: string;
  current: number;
  target: number;
  hint?: string;
  icon?: ReactNode;
  className?: string;
};

export function GoalProgress({
  label,
  current,
  target,
  hint,
  icon,
  className,
}: GoalProgressProps) {
  const safeTarget = target > 0 ? target : 0;
  const ratio = safeTarget > 0 ? current / safeTarget : 0;
  const percent = Math.min(Math.round(ratio * 100), 999);
  const reached = safeTarget > 0 && current >= safeTarget;
  const near = safeTarget > 0 && !reached && ratio >= 0.8;
  const barWidth = Math.min(ratio * 100, 100);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-surface p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-forest">
            {formatMoney(current)}
            <span className="mx-1.5 text-sm font-normal text-muted">/</span>
            <span className="text-base font-medium text-muted">
              {safeTarget > 0 ? formatMoney(safeTarget) : "—"}
            </span>
          </p>
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              reached
                ? "bg-lime/40 text-forest"
                : near
                  ? "bg-apple/25 text-forest"
                  : "bg-muted-light text-olive",
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted-light">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            reached ? "bg-apple" : near ? "bg-lime" : "bg-olive",
          )}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-medium",
            reached ? "text-olive" : near ? "text-forest" : "text-muted",
          )}
        >
          {safeTarget > 0
            ? reached
              ? "Hedef tamamlandı"
              : `%${percent} tamamlandı`
            : "Hedef tanımlı değil"}
        </span>
        {hint ? <span className="text-muted">{hint}</span> : null}
      </div>
    </div>
  );
}
