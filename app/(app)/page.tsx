"use client";

import { CashSessionCard } from "@/components/domain/cash-session-card";
import { StatCard } from "@/components/domain/stat-card";
import { TransactionForm } from "@/components/domain/transaction-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useAppStore } from "@/lib/store/app-store";
import type { Transaction, TransactionType } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils/format";
import {
  expectedCashBalance,
  sumByType,
  todayTransactions,
} from "@/lib/utils/stats";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Scale,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const {
    transactions,
    categories,
    openSession,
    addTransaction,
  } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TransactionType>("income");

  const todayTx = useMemo(
    () => todayTransactions(transactions),
    [transactions],
  );
  const income = sumByType(todayTx, "income");
  const expense = sumByType(todayTx, "expense");
  const net = income - expense;
  const expected = expectedCashBalance(openSession, transactions);

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    [transactions],
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const columns: Column<Transaction>[] = [
    {
      id: "date",
      header: "Tarih",
      cell: (row) => formatDate(row.date),
    },
    {
      id: "type",
      header: "Tür",
      cell: (row) => (
        <Badge variant={row.type === "income" ? "income" : "expense"}>
          {row.type === "income" ? "Gelir" : "Gider"}
        </Badge>
      ),
    },
    {
      id: "category",
      header: "Kategori",
      cell: (row) => categoryMap[row.categoryId] ?? "—",
    },
    {
      id: "description",
      header: "Açıklama",
      cell: (row) => row.description,
      className: "max-w-[200px] truncate",
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
    },
  ];

  function openAdd(type: TransactionType) {
    setDefaultType(type);
    setModalOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Bugünün kasa özeti ve son hareketler"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => openAdd("income")}
            >
              Gelir ekle
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => openAdd("expense")}
            >
              Gider ekle
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bugünkü gelir"
          value={formatMoney(income)}
          icon={<ArrowUpRight className="h-5 w-5" />}
          trend="up"
        />
        <StatCard
          label="Bugünkü gider"
          value={formatMoney(expense)}
          icon={<ArrowDownRight className="h-5 w-5" />}
          trend="down"
        />
        <StatCard
          label="Net"
          value={formatMoney(net)}
          icon={<Scale className="h-5 w-5" />}
          trend={net >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Kasa durumu"
          value={openSession ? "Açık" : "Kapalı"}
          hint={
            expected != null
              ? `Beklenen: ${formatMoney(expected)}`
              : "Kasa sayfasından açın"
          }
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {openSession ? (
            <CashSessionCard
              session={openSession}
              expectedBalance={expected}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="font-medium text-forest">Kasa kapalı</p>
                <p className="mt-1 text-sm text-muted">
                  Güne başlamak için kasa açılışı yapın.
                </p>
                <Link
                  href="/kasa"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-forest px-4 text-sm font-medium text-cream shadow-sm transition-colors hover:bg-olive"
                >
                  Kasaya git
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Son işlemler</CardTitle>
            <Link
              href="/islemler"
              className="text-sm font-medium text-olive hover:text-forest"
            >
              Tümü
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable
              columns={columns}
              data={recent}
              keyExtractor={(r) => r.id}
              emptyTitle="Henüz işlem yok"
              emptyDescription="Hızlı aksiyonlarla ilk gelir veya giderinizi ekleyin."
            />
          </CardContent>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={defaultType === "income" ? "Gelir ekle" : "Gider ekle"}
      >
        <TransactionForm
          key={defaultType}
          categories={categories}
          defaultType={defaultType}
          onCancel={() => setModalOpen(false)}
          onSubmit={(values) => {
            addTransaction(values);
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
