"use client";

import { CommerceCart } from "@/components/domain/commerce-cart";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { Purchase } from "@/lib/types";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils/format";
import { paymentMethodLabel } from "@/lib/utils/labels";
import { PackagePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function PurchasesPage() {
  const { products, purchases, createPurchase, deletePurchase } = useAppStore();
  const { notify } = useFeedback();
  const [deleting, setDeleting] = useState<Purchase | null>(null);

  const sorted = useMemo(
    () =>
      [...purchases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [purchases],
  );

  const columns: Column<Purchase>[] = [
    {
      id: "date",
      header: "Tarih",
      cell: (row) => formatDate(row.date),
      exportValue: (row) => formatDate(row.date),
      sortValue: (row) => row.date,
    },
    {
      id: "supplier",
      header: "Tedarikçi",
      cell: (row) => row.supplier || "—",
      exportValue: (row) => row.supplier || "—",
    },
    {
      id: "items",
      header: "Kalemler",
      cell: (row) => (
        <span className="line-clamp-2 text-sm">
          {row.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
        </span>
      ),
      exportValue: (row) =>
        row.lines.map((l) => `${l.qty}× ${l.name}`).join("; "),
    },
    {
      id: "payment",
      header: "Ödeme",
      cell: (row) => (
        <Badge variant="neutral">
          {paymentMethodLabel(row.paymentMethod)}
        </Badge>
      ),
      exportValue: (row) => paymentMethodLabel(row.paymentMethod),
    },
    {
      id: "total",
      header: "Toplam",
      className: "text-right",
      cell: (row) => (
        <span className="font-medium tabular-nums text-danger">
          {formatMoney(row.total)}
        </span>
      ),
      exportValue: (row) => formatMoney(row.total),
      sortValue: (row) => row.total,
    },
    {
      id: "created",
      header: "Oluşturma",
      cell: (row) => (
        <span className="text-xs text-muted">
          {formatDateTime(row.createdAt)}
        </span>
      ),
      exportValue: (row) => formatDateTime(row.createdAt),
      sortValue: (row) => row.createdAt,
    },
    {
      id: "actions",
      header: "",
      excludeFromExport: true,
      excludeFromSearch: true,
      className: "text-right",
      mobileLabel: "İşlem",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-danger"
          onClick={() => setDeleting(row)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Alış"
        description="Ürünler kataloğundan tedarik kalemi seçin — gider otomatik oluşur"
        actions={
          <Link
            href="/urunler"
            className="inline-flex h-8 items-center rounded-xl border border-border bg-surface px-3 text-sm font-medium text-olive hover:border-apple hover:text-forest"
          >
            Ürünler
          </Link>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4" />
            Yeni alış
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <CommerceCart
            mode="purchase"
            products={products}
            extraField="supplier"
            submitLabel="Alışı kaydet"
            onSubmit={(payload) => {
              const result = createPurchase(payload);
              if (!result.ok) {
                notify({
                  title: "Alış kaydedilemedi",
                  description: result.error,
                  status: "error",
                  variant: "toast",
                });
                return false;
              }
              notify({
                title: "Alış kaydedildi",
                description: `${formatMoney(result.purchase.total)} gider olarak işlendi`,
                status: "success",
                variant: "toast",
              });
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alış geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <DataTable
            columns={columns}
            data={sorted}
            keyExtractor={(r) => r.id}
            toolbar={{
              title: "Alışlar",
              filename: "alislar",
              searchPlaceholder: "Alış ara...",
            }}
            emptyTitle="Henüz alış yok"
            emptyDescription="Yukarıdan tedarik alışı ekleyin."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Alışı sil"
        description="Alış ve bağlı gider işlemi birlikte silinecek."
        confirmLabel="Sil"
        danger
        onConfirm={() => {
          if (!deleting) return;
          deletePurchase(deleting.id);
          notify({
            title: "Alış silindi",
            status: "success",
            variant: "modal",
          });
        }}
      />
    </div>
  );
}
