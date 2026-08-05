import type { DocLine, Product, Purchase, Sale } from "@/lib/types";

export function migrateProduct(p: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    id: p.id,
    name: p.name,
    sellPrice: p.sellPrice ?? 0,
    buyPrice: p.buyPrice ?? 0,
    kind: p.kind ?? "sell",
    active: p.active ?? true,
    trackStock: p.trackStock ?? true,
    stockQty: typeof p.stockQty === "number" ? p.stockQty : 0,
    lowStockAt: typeof p.lowStockAt === "number" ? p.lowStockAt : 5,
    unit: p.unit?.trim() || "adet",
  };
}

/** Satırlardaki productId’lere göre stok güncelle (direction: +1 giriş, -1 çıkış) */
export function applyStockFromLines(
  products: Product[],
  lines: DocLine[],
  direction: 1 | -1,
): Product[] {
  const deltas = new Map<string, number>();
  for (const line of lines) {
    if (!line.productId || line.qty <= 0) continue;
    deltas.set(
      line.productId,
      (deltas.get(line.productId) ?? 0) + line.qty * direction,
    );
  }
  if (deltas.size === 0) return products;

  return products.map((p) => {
    if (!p.trackStock) return p;
    const delta = deltas.get(p.id);
    if (!delta) return p;
    const next = Math.round((p.stockQty + delta) * 1000) / 1000;
    return { ...p, stockQty: next };
  });
}

export function isLowStock(p: Product): boolean {
  return p.trackStock && p.lowStockAt > 0 && p.stockQty <= p.lowStockAt;
}

export function formatStockQty(qty: number, unit = "adet"): string {
  const n =
    Math.abs(qty % 1) < 0.001
      ? String(Math.round(qty))
      : qty.toLocaleString("tr-TR", { maximumFractionDigits: 3 });
  return `${n} ${unit}`;
}

export function productSoldQty(sales: Sale[], productId: string): number {
  let total = 0;
  for (const sale of sales) {
    for (const line of sale.lines) {
      if (line.productId === productId) total += line.qty;
    }
  }
  return Math.round(total * 1000) / 1000;
}

export function productPurchasedQty(
  purchases: Purchase[],
  productId: string,
): number {
  let total = 0;
  for (const purchase of purchases) {
    for (const line of purchase.lines) {
      if (line.productId === productId) total += line.qty;
    }
  }
  return Math.round(total * 1000) / 1000;
}
