"use client";

import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  mobileLabel?: string;
  hideOnMobile?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = "Kayıt bulunamadı",
  emptyDescription,
  emptyAction,
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-4 py-3 font-medium whitespace-nowrap",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-border/70 last:border-0 hover:bg-cream/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn("px-4 py-3 align-middle", col.className)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className="rounded-xl border border-border bg-cream/40 p-4"
          >
            {columns
              .filter((c) => !c.hideOnMobile)
              .map((col) => (
                <div
                  key={col.id}
                  className="flex items-start justify-between gap-3 py-1.5 text-sm"
                >
                  <span className="text-muted">
                    {col.mobileLabel ?? col.header}
                  </span>
                  <div className="text-right font-medium text-forest">
                    {col.cell(row)}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
