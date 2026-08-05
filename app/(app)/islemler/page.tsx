"use client";

import { TransactionForm } from "@/components/domain/transaction-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { PaymentMethod, Transaction, TransactionType } from "@/lib/types";
import { formatDate, formatMoney, todayISO } from "@/lib/utils/format";
import { paymentMethodLabel, paymentMethodLabels } from "@/lib/utils/labels";
import { sumByType, todayTransactions } from "@/lib/utils/stats";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export default function TransactionsPage() {
  const {
    transactions,
    categories,
    business,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAppStore();
  const { notify } = useFeedback();

  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentMethod>(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [defaultType, setDefaultType] = useState<TransactionType>("income");

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) =>
        paymentFilter === "all"
          ? true
          : (t.paymentMethod ?? "cash") === paymentFilter,
      )
      .filter((t) =>
        categoryFilter === "all" ? true : t.categoryId === categoryFilter,
      )
      .filter((t) => (from ? t.date >= from : true))
      .filter((t) => (to ? t.date <= to : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [transactions, typeFilter, paymentFilter, categoryFilter, from, to]);

  const columns: Column<Transaction>[] = [
    {
      id: "date",
      header: "Tarih",
      cell: (row) => formatDate(row.date),
      exportValue: (row) => formatDate(row.date),
      sortValue: (row) => row.date,
    },
    {
      id: "type",
      header: "Tür",
      cell: (row) => (
        <Badge variant={row.type === "income" ? "income" : "expense"}>
          {row.type === "income" ? "Gelir" : "Gider"}
        </Badge>
      ),
      exportValue: (row) => (row.type === "income" ? "Gelir" : "Gider"),
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
      id: "category",
      header: "Kategori",
      cell: (row) => categoryMap[row.categoryId] ?? "—",
      exportValue: (row) => categoryMap[row.categoryId] ?? "—",
    },
    {
      id: "description",
      header: "Açıklama",
      cell: (row) => (
        <div className="max-w-xs">
          <span className="line-clamp-2">{row.description}</span>
          {row.source === "sale" || row.source === "purchase" ? (
            <Badge variant="success" className="mt-1">
              {row.source === "sale" ? "Satış fişi" : "Alış fişi"}
            </Badge>
          ) : null}
        </div>
      ),
      exportValue: (row) => {
        const tag =
          row.source === "sale"
            ? " [Satış]"
            : row.source === "purchase"
              ? " [Alış]"
              : "";
        return `${row.description}${tag}`;
      },
    },
    {
      id: "amount",
      header: "Tutar",
      className: "text-right",
      cell: (row) => (
        <span
          className={
            row.type === "income"
              ? "font-medium tabular-nums text-olive"
              : "font-medium tabular-nums text-danger"
          }
        >
          {row.type === "income" ? "+" : "−"}
          {formatMoney(row.amount)}
        </span>
      ),
      exportValue: (row) =>
        `${row.type === "income" ? "+" : "-"}${formatMoney(row.amount)}`,
      sortValue: (row) =>
        row.type === "income" ? row.amount : -row.amount,
    },
    {
      id: "actions",
      header: "",
      hideOnMobile: false,
      mobileLabel: "İşlem",
      className: "text-right",
      excludeFromExport: true,
      excludeFromSearch: true,
      cell: (row) => {
        const linked = row.source === "sale" || row.source === "purchase";
        return (
          <div className="flex justify-end gap-1">
            {!linked ? (
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                aria-label="Düzenle"
                onClick={() => {
                  setEditing(row);
                  setModalOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-danger hover:bg-danger-soft"
              aria-label="Sil"
              onClick={() => setDeleting(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="İşlemler"
        description="Gelir ve gider hareketlerini yönetin"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setDefaultType("income");
                setModalOpen(true);
              }}
            >
              Gelir
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setDefaultType("expense");
                setModalOpen(true);
              }}
            >
              Gider
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="Tür">
            <Select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | TransactionType)
              }
            >
              <option value="all">Tümü</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </Select>
          </FormField>
          <FormField label="Ödeme">
            <Select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(e.target.value as "all" | PaymentMethod)
              }
            >
              <option value="all">Tümü</option>
              {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {paymentMethodLabels[key]}
                  </option>
                ),
              )}
            </Select>
          </FormField>
          <FormField label="Kategori">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Tümü</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Başlangıç">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </FormField>
          <FormField label="Bitiş">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.id}
            toolbar={{
              title: "İşlemler",
              filename: "islemler",
              searchPlaceholder: "Açıklama, kategori ara...",
            }}
            emptyTitle="Filtreye uygun işlem yok"
            emptyDescription="Filtreleri temizleyin veya yeni işlem ekleyin."
            emptyAction={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setDefaultType("income");
                  setModalOpen(true);
                }}
              >
                İşlem ekle
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "İşlemi düzenle" : "Yeni işlem"}
      >
        <TransactionForm
          key={editing?.id ?? defaultType}
          categories={categories}
          initial={editing}
          defaultType={defaultType}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={(values) => {
            if (editing) {
              updateTransaction(editing.id, values);
              notify({
                title: "İşlem güncellendi",
                status: "success",
                variant: "toast",
              });
            } else {
              const todayIncome = sumByType(
                todayTransactions(transactions),
                "income",
              );
              addTransaction(values);
              const isTodayIncome =
                values.type === "income" && values.date === todayISO();
              const hitGoal =
                isTodayIncome &&
                business.dailyIncomeTarget > 0 &&
                todayIncome < business.dailyIncomeTarget &&
                todayIncome + values.amount >= business.dailyIncomeTarget;
              notify({
                title: hitGoal ? "Günlük hedefe ulaşıldı!" : "İşlem eklendi",
                description: hitGoal
                  ? "Tebrikler, bugünkü gelir hedefini tamamladınız."
                  : undefined,
                status: "success",
                variant: hitGoal ? "modal" : "toast",
              });
            }
            setModalOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="İşlemi sil"
        description={
          deleting?.source === "sale"
            ? "Bu işlem bir satış fişine bağlı. Silinirse satış kaydı da kaldırılır."
            : deleting?.source === "purchase"
              ? "Bu işlem bir alış fişine bağlı. Silinirse alış kaydı da kaldırılır."
              : "Bu işlem kalıcı olarak silinecek."
        }
        confirmLabel="Sil"
        danger
        onConfirm={() => {
          if (!deleting) return;
          deleteTransaction(deleting.id);
          notify({
            title: "İşlem silindi",
            description: "Kayıt başarıyla kaldırıldı.",
            status: "success",
            variant: "modal",
          });
        }}
      />
    </div>
  );
}
