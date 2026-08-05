import { cn } from "@/lib/utils/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-2 border-muted-light border-t-apple",
        className,
      )}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}
