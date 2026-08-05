"use client";

import { CommerceCart } from "@/components/domain/commerce-cart";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { Sale } from "@/lib/types";
import { formatDate, formatDateTime, formatMoney, todayISO } from "@/lib/utils/format";
import { paymentMethodLabel } from "@/lib/utils/labels";
import { sumByType, todayTransactions } from "@/lib/utils/stats";
import { ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function SalesPage() {
  const {
    products,
    sales,
    openSession,
    business,
    transactions,
    createSale,
    deleteSale,
  } = useAppStore();
  const { notify } = useFeedback();
  const [deleting, setDeleting] = useState<Sale | null>(null);

  const sorted = useMemo(
    () =>
      [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [sales],
  );

  const columns: Column<Sale>[] = [
    {
      id: "date",
      header: "Tarih",
      cell: (row) => formatDate(row.date),
      exportValue: (row) => formatDate(row.date),
      sortValue: (row) => row.date,
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
        <span className="font-medium tabular-nums text-olive">
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
        title="Satış"
        description="Ürünler kataloğundan seçin — kasa işlemi otomatik oluşur"
        actions={
          <Link
            href="/urunler"
            className="inline-flex h-8 items-center rounded-xl border border-border bg-surface px-3 text-sm font-medium text-olive hover:border-apple hover:text-forest"
          >
            Ürünler
          </Link>
        }
      />

      {!openSession ? (
        <Alert variant="warning" title="Kasa kapalı" className="mb-4">
          Satış yapabilirsiniz; nakit sayımı için kasayı açmanız önerilir.{" "}
          <Link href="/kasa" className="font-medium underline">
            Kasaya git
          </Link>
        </Alert>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Yeni satış
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <CommerceCart
            mode="sale"
            products={products}
            submitLabel="Satışı tamamla"
            onSubmit={(payload) => {
              const todayIncome = sumByType(
                todayTransactions(transactions),
                "income",
              );
              const result = createSale(payload);
              if (!result.ok) {
                notify({
                  title: "Satış yapılamadı",
                  description: result.error,
                  status: "error",
                  variant: "toast",
                });
                return false;
              }

              const isToday = payload.date === todayISO();
              const hitGoal =
                isToday &&
                business.dailyIncomeTarget > 0 &&
                todayIncome < business.dailyIncomeTarget &&
                todayIncome + result.sale.total >= business.dailyIncomeTarget;

              notify({
                title: hitGoal
                  ? "Satış tamam · günlük hedefe ulaşıldı!"
                  : "Satış kaydedildi",
                description: `${formatMoney(result.sale.total)} · İşlemler’e eklendi`,
                status: "success",
                variant: hitGoal ? "modal" : "toast",
              });
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Satış geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <DataTable
            columns={columns}
            data={sorted}
            keyExtractor={(r) => r.id}
            toolbar={{
              title: "Satışlar",
              filename: "satislar",
              searchPlaceholder: "Satış ara...",
            }}
            emptyTitle="Henüz satış yok"
            emptyDescription="Yukarıdan ilk satışınızı tamamlayın."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Satışı sil"
        description="Satış ve bağlı kasa işlemi birlikte silinecek."
        confirmLabel="Sil"
        danger
        onConfirm={() => {
          if (!deleting) return;
          deleteSale(deleting.id);
          notify({
            title: "Satış silindi",
            status: "success",
            variant: "modal",
          });
        }}
      />
    </div>
  );
}
