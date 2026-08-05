"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  DiningTable,
  DocLine,
  PaymentMethod,
  Product,
  TableOrder,
} from "@/lib/types";
import { docTotal, lineTotal } from "@/lib/types";
import { formatMoney, uid } from "@/lib/utils/format";
import { paymentMethodLabels } from "@/lib/utils/labels";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type TableOrderPanelProps = {
  table: DiningTable;
  order: TableOrder;
  products: Product[];
  onChangeLines: (lines: DocLine[]) => void;
  onChangeNote: (note: string) => void;
  onChangeGuests: (guestCount: number) => void;
  onPay: (paymentMethod: PaymentMethod, note?: string) => void;
  onCancel: () => void;
};

export function TableOrderPanel({
  table,
  order,
  products,
  onChangeLines,
  onChangeNote,
  onChangeGuests,
  onPay,
  onCancel,
}: TableOrderPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const catalog = useMemo(
    () =>
      products
        .filter((p) => p.active && (p.kind === "sell" || p.kind === "both"))
        .sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [products],
  );

  const total = docTotal(order.lines);

  function addProduct(product: Product) {
    const existing = order.lines.find((l) => l.productId === product.id);
    if (existing) {
      onChangeLines(
        order.lines.map((l) =>
          l.id === existing.id ? { ...l, qty: l.qty + 1 } : l,
        ),
      );
    } else {
      onChangeLines([
        ...order.lines,
        {
          id: uid("ln"),
          productId: product.id,
          name: product.name,
          qty: 1,
          unitPrice: product.sellPrice,
        },
      ]);
    }
    setError("");
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) {
      onChangeLines(order.lines.filter((l) => l.id !== id));
      return;
    }
    onChangeLines(
      order.lines.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }

  function handlePay() {
    if (order.lines.length === 0) {
      setError("Ödeme için en az bir ürün ekleyin.");
      return;
    }
    onPay(paymentMethod, order.note);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-forest">{table.name}</p>
          <p className="text-sm text-muted">Açık adisyon</p>
        </div>
        <FormField label="Kişi" htmlFor="guest-count" className="w-24">
          <Input
            id="guest-count"
            type="number"
            min="1"
            max="30"
            value={order.guestCount ?? ""}
            placeholder={String(table.capacity)}
            onChange={(e) => onChangeGuests(Number(e.target.value) || 0)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="mb-2 text-sm font-medium text-forest">Ürünler</p>
          {catalog.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              Satış ürünü yok. Ürünler sayfasından ekleyin.
            </p>
          ) : (
            <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
              {catalog.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-3 text-left transition-colors hover:border-apple hover:bg-cream/60"
                >
                  <p className="font-medium text-forest">{p.name}</p>
                  <p className="mt-1 text-sm tabular-nums text-olive">
                    {formatMoney(p.sellPrice)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-cream/40 p-4 lg:col-span-2">
          <p className="text-sm font-semibold text-forest">Adisyon</p>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {order.lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Ürüne tıklayarak ekleyin
              </p>
            ) : (
              order.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center gap-2 rounded-xl bg-surface px-2 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-forest">
                      {line.name}
                    </p>
                    <p className="text-xs tabular-nums text-muted">
                      {formatMoney(line.unitPrice)} × {line.qty} ={" "}
                      {formatMoney(lineTotal(line))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => setQty(line.id, line.qty - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">
                      {line.qty}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => setQty(line.id, line.qty + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2 text-danger"
                      onClick={() => setQty(line.id, 0)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <FormField label="Not" htmlFor="order-note">
              <Textarea
                id="order-note"
                value={order.note ?? ""}
                onChange={(e) => onChangeNote(e.target.value)}
                placeholder="Opsiyonel"
                className="min-h-14"
              />
            </FormField>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Toplam</span>
              <span className="text-xl font-semibold tabular-nums text-forest">
                {formatMoney(total)}
              </span>
            </div>

            {error ? <p className="text-xs text-danger">{error}</p> : null}

            {!paying ? (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full"
                  disabled={order.lines.length === 0}
                  onClick={() => {
                    setError("");
                    setPaying(true);
                  }}
                >
                  Öde
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-danger"
                  onClick={onCancel}
                >
                  Adisyonu iptal et
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
                <FormField label="Ödeme yöntemi" htmlFor="pay-method">
                  <Select
                    id="pay-method"
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                  >
                    {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {paymentMethodLabels[key]}
                        </option>
                      ),
                    )}
                  </Select>
                </FormField>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setPaying(false)}
                  >
                    Geri
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handlePay}
                  >
                    {formatMoney(total)} tahsil et
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
