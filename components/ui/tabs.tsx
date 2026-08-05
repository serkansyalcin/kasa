"use client";

import { cn } from "@/lib/utils/cn";

export type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-muted-light p-1",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-surface text-forest shadow-sm"
                : "text-muted hover:text-forest",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
