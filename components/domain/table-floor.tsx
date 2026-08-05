"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import type { DiningTable, TableOrder } from "@/lib/types";
import { docTotal } from "@/lib/types";
import { Users } from "lucide-react";

export type FloorTableView = {
  table: DiningTable;
  order: TableOrder | null;
};

type TableFloorProps = {
  items: FloorTableView[];
  onSelect: (item: FloorTableView) => void;
};

function openedLabel(openedAt: string): string {
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000),
  );
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

export function TableFloor({ items, onSelect }: TableFloorProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
        Aktif masa yok. “Masa tanımları”ndan ekleyin.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const occupied = Boolean(item.order);
        const total = item.order ? docTotal(item.order.lines) : 0;
        return (
          <button
            key={item.table.id}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "cursor-pointer rounded-2xl border px-4 py-4 text-left transition-colors",
              occupied
                ? "border-apple/50 bg-lime/15 hover:border-apple hover:bg-lime/25"
                : "border-border bg-surface hover:border-olive/40 hover:bg-cream/50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-xl text-forest">
                  {item.table.name}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Users className="h-3.5 w-3.5" />
                  {item.order?.guestCount
                    ? `${item.order.guestCount} kişi`
                    : `${item.table.capacity} kişilik`}
                </p>
              </div>
              <Badge variant={occupied ? "open" : "closed"}>
                {occupied ? "Dolu" : "Boş"}
              </Badge>
            </div>

            {occupied && item.order ? (
              <div className="mt-4 flex items-end justify-between gap-2 border-t border-border/60 pt-3">
                <span className="text-xs text-muted">
                  {openedLabel(item.order.openedAt)}
                </span>
                <span className="text-lg font-semibold tabular-nums text-forest">
                  {formatMoney(total)}
                </span>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">Adisyon açmak için tıkla</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
