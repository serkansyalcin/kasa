"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { Product, ProductKind } from "@/lib/types";
import { formatMoney } from "@/lib/utils/format";
import {
  formatStockQty,
  isLowStock,
  productPurchasedQty,
  productSoldQty,
} from "@/lib/utils/stock";
import {
  Package,
  PackagePlus,
  Pencil,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

const kindLabels: Record<ProductKind, string> = {
  sell: "Satış",
  buy: "Alış",
  both: "Alış + Satış",
};

type FilterId = "all" | "sell" | "buy" | "low" | "inactive";

export default function ProductsPage() {
  const {
    products,
    sales,
    purchases,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  } = useAppStore();
  const { notify } = useFeedback();

  const [filter, setFilter] = useState<FilterId>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [name, setName] = useState("");
  const [sellPrice, setSellPrice] = useState("0");
  const [buyPrice, setBuyPrice] = useState("0");
  const [kind, setKind] = useState<ProductKind>("sell");
  const [active, setActive] = useState(true);
  const [trackStock, setTrackStock] = useState(true);
  const [stockQty, setStockQty] = useState("0");
  const [lowStockAt, setLowStockAt] = useState("5");
  const [unit, setUnit] = useState("adet");
  const [error, setError] = useState("");

  const counts = useMemo(() => {
    const activeList = products.filter((p) => p.active);
    return {
      all: products.length,
      sell: activeList.filter((p) => p.kind === "sell" || p.kind === "both")
        .length,
      buy: activeList.filter((p) => p.kind === "buy" || p.kind === "both")
        .length,
      low: products.filter((p) => p.active && isLowStock(p)).length,
      inactive: products.filter((p) => !p.active).length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (filter === "inactive") return !p.active;
      if (filter === "low") return p.active && isLowStock(p);
      if (!p.active) return false;
      if (filter === "sell") return p.kind === "sell" || p.kind === "both";
      if (filter === "buy") return p.kind === "buy" || p.kind === "both";
      return true;
    });
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [products, filter]);

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Ürün",
        cell: (row) => (
          <div>
            <span className="font-medium text-forest">{row.name}</span>
            {!row.active ? (
              <Badge variant="closed" className="ml-2">
                Pasif
              </Badge>
            ) : null}
          </div>
        ),
        exportValue: (row) => row.name,
        sortValue: (row) => row.name,
      },
      {
        id: "kind",
        header: "Kullanım",
        cell: (row) => <Badge variant="neutral">{kindLabels[row.kind]}</Badge>,
        exportValue: (row) => kindLabels[row.kind],
      },
      {
        id: "stock",
        header: "Stok",
        className: "text-right",
        cell: (row) => {
          if (!row.trackStock) {
            return <span className="text-xs text-muted">Takip yok</span>;
          }
          const low = isLowStock(row);
          return (
            <span
              className={
                low
                  ? "font-medium tabular-nums text-danger"
                  : "tabular-nums text-forest"
              }
            >
              {formatStockQty(row.stockQty, row.unit)}
              {low ? (
                <Badge variant="expense" className="ml-2">
                  Düşük
                </Badge>
              ) : null}
            </span>
          );
        },
        exportValue: (row) =>
          row.trackStock ? formatStockQty(row.stockQty, row.unit) : "Takip yok",
        sortValue: (row) => (row.trackStock ? row.stockQty : -Infinity),
      },
      {
        id: "sold",
        header: "Satılan",
        className: "text-right",
        cell: (row) => {
          const qty = productSoldQty(sales, row.id);
          return (
            <span className="tabular-nums text-muted">
              {qty > 0 ? formatStockQty(qty, row.unit) : "—"}
            </span>
          );
        },
        exportValue: (row) => String(productSoldQty(sales, row.id)),
        sortValue: (row) => productSoldQty(sales, row.id),
      },
      {
        id: "bought",
        header: "Alınan",
        className: "text-right",
        cell: (row) => {
          const qty = productPurchasedQty(purchases, row.id);
          return (
            <span className="tabular-nums text-muted">
              {qty > 0 ? formatStockQty(qty, row.unit) : "—"}
            </span>
          );
        },
        exportValue: (row) => String(productPurchasedQty(purchases, row.id)),
        sortValue: (row) => productPurchasedQty(purchases, row.id),
      },
      {
        id: "sell",
        header: "Satış fiyatı",
        className: "text-right",
        cell: (row) => (
          <span className="tabular-nums">
            {row.kind === "buy" ? "—" : formatMoney(row.sellPrice)}
          </span>
        ),
        exportValue: (row) =>
          row.kind === "buy" ? "—" : formatMoney(row.sellPrice),
        sortValue: (row) => row.sellPrice,
      },
      {
        id: "buy",
        header: "Alış fiyatı",
        className: "text-right",
        cell: (row) => (
          <span className="tabular-nums">
            {row.kind === "sell" ? "—" : formatMoney(row.buyPrice)}
          </span>
        ),
        exportValue: (row) =>
          row.kind === "sell" ? "—" : formatMoney(row.buyPrice),
        sortValue: (row) => row.buyPrice,
      },
      {
        id: "actions",
        header: "",
        excludeFromExport: true,
        excludeFromSearch: true,
        className: "text-right",
        mobileLabel: "İşlem",
        cell: (row) => (
          <div className="flex justify-end gap-1">
            {row.trackStock ? (
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                aria-label="Stok düzelt"
                onClick={() => {
                  setAdjusting(row);
                  setAdjustQty(String(row.stockQty));
                }}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => openEdit(row)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-danger"
              onClick={() => setDeleting(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [sales, purchases],
  );

  function openCreate() {
    setEditing(null);
    setName("");
    setSellPrice("90");
    setBuyPrice("0");
    setKind("sell");
    setActive(true);
    setTrackStock(true);
    setStockQty("0");
    setLowStockAt("5");
    setUnit("adet");
    setError("");
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setName(product.name);
    setSellPrice(String(product.sellPrice));
    setBuyPrice(String(product.buyPrice));
    setKind(product.kind);
    setActive(product.active);
    setTrackStock(product.trackStock);
    setStockQty(String(product.stockQty));
    setLowStockAt(String(product.lowStockAt));
    setUnit(product.unit || "adet");
    setError("");
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ürün adı gerekli.");
      return;
    }
    const sell = Number(sellPrice.replace(",", "."));
    const buy = Number(buyPrice.replace(",", "."));
    const stock = Number(stockQty.replace(",", "."));
    const low = Number(lowStockAt.replace(",", "."));
    if (Number.isNaN(sell) || sell < 0 || Number.isNaN(buy) || buy < 0) {
      setError("Fiyatlar geçersiz.");
      return;
    }
    if ((kind === "sell" || kind === "both") && sell <= 0) {
      setError("Satış fiyatı gerekli.");
      return;
    }
    if ((kind === "buy" || kind === "both") && buy <= 0) {
      setError("Alış fiyatı gerekli.");
      return;
    }
    if (trackStock && (Number.isNaN(stock) || stock < 0)) {
      setError("Stok miktarı geçersiz.");
      return;
    }
    if (trackStock && (Number.isNaN(low) || low < 0)) {
      setError("Düşük stok eşiği geçersiz.");
      return;
    }

    const payload = {
      name: name.trim(),
      sellPrice: kind === "buy" ? 0 : sell,
      buyPrice: kind === "sell" ? 0 : buy,
      kind,
      active,
      trackStock,
      stockQty: trackStock ? stock : 0,
      lowStockAt: trackStock ? low : 0,
      unit: unit.trim() || "adet",
    };

    if (editing) {
      updateProduct(editing.id, payload);
      notify({ title: "Ürün güncellendi", status: "success", variant: "toast" });
    } else {
      addProduct(payload);
      notify({
        title: "Ürün eklendi",
        description: "Satış, alış ve stok takibine hazır.",
        status: "success",
        variant: "toast",
      });
    }
    setModalOpen(false);
  }

  function handleAdjust(e: FormEvent) {
    e.preventDefault();
    if (!adjusting) return;
    const qty = Number(adjustQty.replace(",", "."));
    const result = adjustStock(adjusting.id, qty);
    if (!result.ok) {
      notify({
        title: "Stok güncellenemedi",
        description: result.error,
        status: "error",
        variant: "toast",
      });
      return;
    }
    notify({
      title: "Stok güncellendi",
      description: formatStockQty(result.product.stockQty, result.product.unit),
      status: "success",
      variant: "toast",
    });
    setAdjusting(null);
  }

  return (
    <div>
      <PageHeader
        title="Ürünler"
        description="Katalog + stok — alış artırır, satış/masa düşürür; satılan ve alınan miktarlar fişlerden hesaplanır"
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreate}
          >
            Ürün ekle
          </Button>
        }
      />

      {counts.low > 0 ? (
        <Alert variant="warning" title="Düşük stok" className="mb-4">
          {counts.low} üründe stok kritik seviyenin altında.{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => setFilter("low")}
          >
            Düşük stokları göster
          </button>
        </Alert>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/30 text-forest">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted">Toplam ürün</p>
              <p className="text-xl font-semibold tabular-nums text-forest">
                {counts.all}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-apple/25 text-forest">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted">Satışta</p>
                <p className="text-xl font-semibold tabular-nums text-forest">
                  {counts.sell}
                </p>
              </div>
            </div>
            <Link
              href="/satis"
              className="text-sm font-medium text-olive hover:text-forest"
            >
              Satışa git
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted-light text-olive">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted">Alışta</p>
                <p className="text-xl font-semibold tabular-nums text-forest">
                  {counts.buy}
                </p>
              </div>
            </div>
            <Link
              href="/alis"
              className="text-sm font-medium text-olive hover:text-forest"
            >
              Alışa git
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted">Düşük stok</p>
              <p className="text-xl font-semibold tabular-nums text-forest">
                {counts.low}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Katalog</CardTitle>
          <Tabs
            value={filter}
            onChange={(id) => setFilter(id as FilterId)}
            items={[
              { id: "all", label: `Tümü (${counts.all - counts.inactive})` },
              { id: "sell", label: `Satış (${counts.sell})` },
              { id: "buy", label: `Alış (${counts.buy})` },
              { id: "low", label: `Düşük stok (${counts.low})` },
              ...(counts.inactive > 0
                ? [{ id: "inactive", label: `Pasif (${counts.inactive})` }]
                : []),
            ]}
          />
        </CardHeader>
        <CardContent className="pt-2">
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.id}
            toolbar={{
              title: "Ürünler",
              filename: "urunler",
              searchPlaceholder: "Ürün ara...",
            }}
            emptyTitle="Bu listede ürün yok"
            emptyDescription="Ürün ekleyin; Satış, Alış ve stok takibine düşer."
            emptyAction={
              <Button size="sm" onClick={openCreate}>
                Ürün ekle
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ürünü düzenle" : "Yeni ürün"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Ad" htmlFor="prd-name" error={error}>
            <Input
              id="prd-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Latte, Süt (L)"
              required
            />
          </FormField>
          <FormField label="Kullanım" htmlFor="prd-kind">
            <Select
              id="prd-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ProductKind)}
            >
              <option value="sell">Sadece satış (menü)</option>
              <option value="buy">Sadece alış (tedarik)</option>
              <option value="both">Hem alış hem satış</option>
            </Select>
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Satış fiyatı (₺)" htmlFor="prd-sell">
              <Input
                id="prd-sell"
                type="number"
                min="0"
                step="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                disabled={kind === "buy"}
              />
            </FormField>
            <FormField label="Alış fiyatı (₺)" htmlFor="prd-buy">
              <Input
                id="prd-buy"
                type="number"
                min="0"
                step="0.01"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                disabled={kind === "sell"}
              />
            </FormField>
          </div>

          <FormField label="Stok takibi" htmlFor="prd-track">
            <Select
              id="prd-track"
              value={trackStock ? "on" : "off"}
              onChange={(e) => setTrackStock(e.target.value === "on")}
            >
              <option value="on">Açık — alış/satış stoku günceller</option>
              <option value="off">Kapalı — örn. reçeteli menü</option>
            </Select>
          </FormField>

          {trackStock ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Mevcut stok" htmlFor="prd-stock">
                <Input
                  id="prd-stock"
                  type="number"
                  min="0"
                  step="0.001"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                />
              </FormField>
              <FormField label="Düşük stok eşiği" htmlFor="prd-low">
                <Input
                  id="prd-low"
                  type="number"
                  min="0"
                  step="0.001"
                  value={lowStockAt}
                  onChange={(e) => setLowStockAt(e.target.value)}
                />
              </FormField>
              <FormField label="Birim" htmlFor="prd-unit">
                <Select
                  id="prd-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="adet">adet</option>
                  <option value="kg">kg</option>
                  <option value="L">L</option>
                  <option value="paket">paket</option>
                </Select>
              </FormField>
            </div>
          ) : null}

          <FormField label="Durum" htmlFor="prd-active">
            <Select
              id="prd-active"
              value={active ? "active" : "inactive"}
              onChange={(e) => setActive(e.target.value === "active")}
            >
              <option value="active">Aktif — listelerde görünür</option>
              <option value="inactive">Pasif — Satış/Alış’ta gizlenir</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              İptal
            </Button>
            <Button type="submit">{editing ? "Kaydet" : "Ekle"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(adjusting)}
        onClose={() => setAdjusting(null)}
        title={adjusting ? `Stok düzelt · ${adjusting.name}` : "Stok düzelt"}
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <p className="text-sm text-muted">
            Sayım sonucunu yazın. Alış ve satış otomatik günceller; burası
            düzeltme / sayım içindir.
          </p>
          <FormField label={`Yeni miktar (${adjusting?.unit ?? "adet"})`} htmlFor="adj-qty">
            <Input
              id="adj-qty"
              type="number"
              min="0"
              step="0.001"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              required
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAdjusting(null)}
            >
              İptal
            </Button>
            <Button type="submit">Kaydet</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Ürünü sil"
        description={`“${deleting?.name}” katalogdan silinecek. Geçmiş satış/alış kayıtları etkilenmez.`}
        confirmLabel="Sil"
        danger
        onConfirm={() => {
          if (!deleting) return;
          deleteProduct(deleting.id);
          notify({
            title: "Ürün silindi",
            status: "success",
            variant: "toast",
          });
        }}
      />
    </div>
  );
}
