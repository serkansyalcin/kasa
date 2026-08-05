"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  useFeedback,
  type FeedbackItem,
  type FeedbackStatus,
} from "@/lib/store/feedback-store";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

const statusStyles: Record<
  FeedbackStatus,
  { panel: string; icon: string; accent: string }
> = {
  success: {
    panel: "border-apple/40 bg-surface",
    icon: "bg-lime/30 text-forest",
    accent: "text-forest",
  },
  error: {
    panel: "border-danger/30 bg-surface",
    icon: "bg-danger-soft text-danger",
    accent: "text-danger",
  },
  info: {
    panel: "border-apple/30 bg-surface",
    icon: "bg-muted-light text-olive",
    accent: "text-forest",
  },
  warning: {
    panel: "border-olive/40 bg-surface",
    icon: "bg-cream text-olive",
    accent: "text-olive",
  },
};

const statusIcons: Record<FeedbackStatus, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  warning: <TriangleAlert className="h-5 w-5" />,
};

function FeedbackCard({
  item,
  onDismiss,
  className,
}: {
  item: FeedbackItem;
  onDismiss: () => void;
  className?: string;
}) {
  const styles = statusStyles[item.status];

  return (
    <div
      role={item.variant === "modal" ? "alertdialog" : "status"}
      aria-live="polite"
      className={cn(
        "pointer-events-auto w-full overflow-hidden rounded-2xl border shadow-lg",
        styles.panel,
        className,
      )}
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            styles.icon,
          )}
        >
          {statusIcons[item.status]}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className={cn("text-sm font-semibold", styles.accent)}>
            {item.title}
          </p>
          {item.description ? (
            <p className="mt-1 text-sm text-muted">{item.description}</p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 px-2"
          aria-label="Kapat"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {item.variant === "modal" ? (
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button size="sm" onClick={onDismiss}>
            Tamam
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Global host: toast (sağ üst) + modal (ortada) */
export function FeedbackHost() {
  const { items, dismiss } = useFeedback();

  const toasts = items.filter((i) => i.variant === "toast");
  const modal = items.find((i) => i.variant === "modal");

  return (
    <>
      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed top-4 right-4 z-[70] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
          {toasts.map((item) => (
            <div key={item.id} className="feedback-enter">
              <FeedbackCard item={item} onDismiss={() => dismiss(item.id)} />
            </div>
          ))}
        </div>
      ) : null}

      {modal ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-forest/40 backdrop-blur-[2px]"
            onClick={() => dismiss(modal.id)}
          />
          <div className="feedback-enter relative z-10 w-full max-w-md">
            <FeedbackCard item={modal} onDismiss={() => dismiss(modal.id)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
