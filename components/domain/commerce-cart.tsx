"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DocLine, PaymentMethod, Product } from "@/lib/types";
import { docTotal, lineTotal } from "@/lib/types";
import { formatMoney, todayISO, uid } from "@/lib/utils/format";
import { paymentMethodLabels } from "@/lib/utils/labels";
import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export type CartLine = DocLine;

type CommerceCartProps = {
  mode: "sale" | "purchase";
  products: Product[];
  submitLabel: string;
  onSubmit: (payload: {
    date: string;
    paymentMethod: PaymentMethod;
    note?: string;
    supplier?: string;
    lines: Omit<DocLine, "id">[];
  }) => boolean | void;
  extraField?: "supplier";
};

export function CommerceCart({
  mode,
  products,
  submitLabel,
  onSubmit,
  extraField,
}: CommerceCartProps) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [date, setDate] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [supplier, setSupplier] = useState("");
  const [error, setError] = useState("");

  const catalog = useMemo(() => {
    return products
      .filter((p) => {
        if (!p.active) return false;
        if (mode === "sale") return p.kind === "sell" || p.kind === "both";
        return p.kind === "buy" || p.kind === "both";
      })
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [products, mode]);

  const total = docTotal(lines);

  function addProduct(product: Product) {
    const unitPrice = mode === "sale" ? product.sellPrice : product.buyPrice;
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.id === existing.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          id: uid("ln"),
          productId: product.id,
          name: product.name,
          qty: 1,
          unitPrice,
        },
      ];
    });
    setError("");
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) {
      setLines((prev) => prev.filter((l) => l.id !== id));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }

  function handleSubmit() {
    if (lines.length === 0) {
      setError("Sepete en az bir kalem ekleyin.");
      return;
    }
    const ok = onSubmit({
      date,
      paymentMethod,
      note: note.trim() || undefined,
      supplier: extraField === "supplier" ? supplier.trim() || undefined : undefined,
      lines: lines.map(({ productId, name, qty, unitPrice }) => ({
        productId,
        name,
        qty,
        unitPrice,
      })),
    });
    if (ok === false) return;
    setLines([]);
    setNote("");
    setSupplier("");
    setError("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-forest">
            {mode === "sale" ? "Satış ürünleri" : "Alış kalemleri"}
            <span className="ml-2 font-normal text-muted">
              ({catalog.length})
            </span>
          </p>
          <Link
            href="/urunler"
            className="text-sm font-medium text-olive hover:text-forest"
          >
            Katalogu yönet
          </Link>
        </div>
        {catalog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm text-muted">
              {mode === "sale"
                ? "Satış için aktif ürün yok."
                : "Alış için aktif ürün yok."}
            </p>
            <p className="mt-1 text-xs text-muted">
              Ürünler sayfasından ekleyin; burada anında görünür.
            </p>
            <Link
              href="/urunler"
              className="mt-4 inline-flex h-8 items-center rounded-xl bg-apple px-3 text-sm font-medium text-forest hover:bg-lime"
            >
              Ürün ekle
            </Link>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.map((p) => {
              const price = mode === "sale" ? p.sellPrice : p.buyPrice;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-3 text-left transition-colors hover:border-apple hover:bg-cream/60"
                >
                  <p className="font-medium text-forest">{p.name}</p>
                  <p className="mt-1 text-sm tabular-nums text-olive">
                    {formatMoney(price)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm lg:col-span-2">
        <p className="text-sm font-semibold text-forest">Sepet</p>

        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Ürüne tıklayarak ekleyin
            </p>
          ) : (
            lines.map((line) => (
              <div
                key={line.id}
                className="flex items-center gap-2 rounded-xl bg-cream/50 px-2 py-2"
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

        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <FormField label="Tarih" htmlFor={`${mode}-date`}>
            <Input
              id={`${mode}-date`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
          <FormField label="Ödeme" htmlFor={`${mode}-pay`}>
            <Select
              id={`${mode}-pay`}
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
          {extraField === "supplier" ? (
            <FormField label="Tedarikçi" htmlFor="supplier">
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Opsiyonel"
              />
            </FormField>
          ) : null}
          <FormField label="Not" htmlFor={`${mode}-note`}>
            <Textarea
              id={`${mode}-note`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opsiyonel"
              className="min-h-16"
            />
          </FormField>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Toplam</span>
            <span className="text-xl font-semibold tabular-nums text-forest">
              {formatMoney(total)}
            </span>
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}

          <Button type="button" className="w-full" onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
