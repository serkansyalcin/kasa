"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { Product, ProductKind } from "@/lib/types";
import { formatMoney } from "@/lib/utils/format";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

const kindLabels: Record<ProductKind, string> = {
  sell: "Satış",
  buy: "Alış",
  both: "Alış + Satış",
};

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useAppStore();
  const { notify } = useFeedback();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [sellPrice, setSellPrice] = useState("0");
  const [buyPrice, setBuyPrice] = useState("0");
  const [kind, setKind] = useState<ProductKind>("sell");
  const [error, setError] = useState("");

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Ürün",
        cell: (row) => <span className="font-medium">{row.name}</span>,
        exportValue: (row) => row.name,
      },
      {
        id: "kind",
        header: "Tür",
        cell: (row) => <Badge variant="neutral">{kindLabels[row.kind]}</Badge>,
        exportValue: (row) => kindLabels[row.kind],
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
    [],
  );

  function openCreate() {
    setEditing(null);
    setName("");
    setSellPrice("90");
    setBuyPrice("0");
    setKind("sell");
    setError("");
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setName(product.name);
    setSellPrice(String(product.sellPrice));
    setBuyPrice(String(product.buyPrice));
    setKind(product.kind);
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

    const payload = {
      name: name.trim(),
      sellPrice: sell,
      buyPrice: buy,
      kind,
      active: true,
    };

    if (editing) {
      updateProduct(editing.id, payload);
      notify({ title: "Ürün güncellendi", status: "success", variant: "toast" });
    } else {
      addProduct(payload);
      notify({ title: "Ürün eklendi", status: "success", variant: "toast" });
    }
    setModalOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Ürünler"
        description="Satış ve alışta kullanılacak ürün / menü kalemleri"
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

      <Card>
        <CardContent className="pt-5">
          <DataTable
            columns={columns}
            data={products}
            keyExtractor={(r) => r.id}
            toolbar={{
              title: "Ürünler",
              filename: "urunler",
              searchPlaceholder: "Ürün ara...",
            }}
            emptyTitle="Ürün yok"
            emptyDescription="Satış ve alış için ürün ekleyin."
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
              required
            />
          </FormField>
          <FormField label="Kullanım" htmlFor="prd-kind">
            <Select
              id="prd-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ProductKind)}
            >
              <option value="sell">Sadece satış</option>
              <option value="buy">Sadece alış</option>
              <option value="both">Alış ve satış</option>
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

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Ürünü sil"
        description={`“${deleting?.name}” silinecek.`}
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
