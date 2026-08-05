"use client";

import { CashSessionCard } from "@/components/domain/cash-session-card";
import { GoalProgress } from "@/components/domain/goal-progress";
import { StatCard } from "@/components/domain/stat-card";
import { TransactionForm } from "@/components/domain/transaction-form";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { Transaction, TransactionType } from "@/lib/types";
import { docTotal } from "@/lib/types";
import { formatDate, formatMoney, todayISO } from "@/lib/utils/format";
import { paymentMethodLabels } from "@/lib/utils/labels";
import {
  expectedCashBalance,
  goalSnapshot,
  filterByDateRange,
  monthTransactions,
  monthlyPaceExpected,
  paymentBreakdown,
  startOfYearISO,
  sumByType,
  todayTransactions,
  weekTransactions,
  yesterdayTransactions,
} from "@/lib/utils/stats";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Scale,
  Target,
  Trophy,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const {
    transactions,
    categories,
    openSession,
    business,
    tableOrders,
    addTransaction,
  } = useAppStore();
  const { notify } = useFeedback();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TransactionType>("income");

  const todayTx = useMemo(
    () => todayTransactions(transactions),
    [transactions],
  );
  const yesterdayTx = useMemo(
    () => yesterdayTransactions(transactions),
    [transactions],
  );
  const weekTx = useMemo(() => weekTransactions(transactions), [transactions]);
  const monthTx = useMemo(
    () => monthTransactions(transactions),
    [transactions],
  );
  const yearTx = useMemo(
    () => filterByDateRange(transactions, startOfYearISO(), todayISO()),
    [transactions],
  );

  const income = sumByType(todayTx, "income");
  const expense = sumByType(todayTx, "expense");
  const net = income - expense;
  const yesterdayIncome = sumByType(yesterdayTx, "income");
  const weekIncome = sumByType(weekTx, "income");
  const monthIncome = sumByType(monthTx, "income");
  const yearIncome = sumByType(yearTx, "income");
  const incomeDelta = income - yesterdayIncome;

  const expected = expectedCashBalance(openSession, transactions);
  const payments = useMemo(() => paymentBreakdown(todayTx), [todayTx]);

  const openTables = useMemo(() => {
    const open = tableOrders.filter((o) => o.status === "open");
    return {
      count: open.length,
      total: open.reduce((s, o) => s + docTotal(o.lines), 0),
    };
  }, [tableOrders]);

  const dailyGoal = goalSnapshot(income, business.dailyIncomeTarget);
  const weeklyGoal = goalSnapshot(weekIncome, business.weeklyIncomeTarget);
  const monthlyGoal = goalSnapshot(monthIncome, business.monthlyIncomeTarget);
  const yearlyGoal = goalSnapshot(yearIncome, business.yearlyIncomeTarget);
  const paceExpected = monthlyPaceExpected(business.monthlyIncomeTarget);
  const aheadOfPace =
    business.monthlyIncomeTarget > 0 && monthIncome >= paceExpected;

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
            <Link
              href="/masalar"
              className="inline-flex h-8 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-medium text-olive hover:border-apple hover:text-forest"
            >
              Masalar
            </Link>
            <Link
              href="/satis"
              className="inline-flex h-8 items-center justify-center rounded-xl bg-apple px-3 text-sm font-medium text-forest shadow-sm transition-colors hover:bg-lime"
            >
              Hızlı satış
            </Link>
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

      <div className="mb-4 space-y-3">
        {!openSession ? (
          <Alert variant="warning" title="Kasa kapalı">
            Bugünkü nakit sayımı için önce kasayı açın.{" "}
            <Link href="/kasa" className="font-medium underline">
              Kasaya git
            </Link>
          </Alert>
        ) : null}
        {dailyGoal.reached ? (
          <Alert variant="success" title="Günlük hedef tamamlandı">
            Tebrikler — bugünkü gelir hedefinin üzerine çıktınız.
          </Alert>
        ) : dailyGoal.target > 0 && dailyGoal.percent >= 80 ? (
          <Alert variant="info" title="Hedefe yaklaştınız">
            Günlük hedefe {formatMoney(dailyGoal.remaining)} kaldı.
          </Alert>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Bugünkü gelir"
          value={formatMoney(income)}
          hint={
            yesterdayIncome > 0 || income > 0
              ? `Düne göre ${incomeDelta >= 0 ? "+" : ""}${formatMoney(incomeDelta)}`
              : "Dün veri yok"
          }
          icon={<ArrowUpRight className="h-5 w-5" />}
          trend={incomeDelta >= 0 ? "up" : "down"}
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
          label="Açık masa"
          value={String(openTables.count)}
          hint={
            openTables.count > 0
              ? `Adisyon: ${formatMoney(openTables.total)}`
              : "Tüm masalar boş"
          }
          icon={<UtensilsCrossed className="h-5 w-5" />}
        />
        <StatCard
          label="Kasa durumu"
          value={openSession ? "Açık" : "Kapalı"}
          hint={
            expected != null
              ? `Nakit beklenen: ${formatMoney(expected)}`
              : "Kasa sayfasından açın"
          }
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GoalProgress
          label="Günlük gelir hedefi"
          current={dailyGoal.current}
          target={dailyGoal.target}
          hint={
            dailyGoal.reached
              ? "Harika gidiş"
              : dailyGoal.target > 0
                ? `Kalan ${formatMoney(dailyGoal.remaining)}`
                : undefined
          }
          icon={<Target className="h-5 w-5" />}
        />
        <GoalProgress
          label="Haftalık gelir hedefi"
          current={weeklyGoal.current}
          target={weeklyGoal.target}
          hint={
            weeklyGoal.target > 0
              ? `Kalan ${formatMoney(weeklyGoal.remaining)}`
              : undefined
          }
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <GoalProgress
          label="Aylık gelir hedefi"
          current={monthlyGoal.current}
          target={monthlyGoal.target}
          hint={
            monthlyGoal.target > 0
              ? aheadOfPace
                ? `Tempo üstü · beklenen ${formatMoney(paceExpected)}`
                : `Tempo altı · beklenen ${formatMoney(paceExpected)}`
              : undefined
          }
          icon={<Trophy className="h-5 w-5" />}
        />
        <GoalProgress
          label="Yıllık gelir hedefi"
          current={yearlyGoal.current}
          target={yearlyGoal.target}
          hint={
            yearlyGoal.target > 0
              ? `Kalan ${formatMoney(yearlyGoal.remaining)}`
              : undefined
          }
          icon={<Trophy className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
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

          <Card>
            <CardHeader>
              <CardTitle>Ödeme kırılımı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {payments.map((p) => (
                <div
                  key={p.method}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted">
                    {paymentMethodLabels[p.method]}
                  </span>
                  <span className="tabular-nums font-medium text-forest">
                    {formatMoney(p.income - p.expense)}
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted">
                Beklenen kasa bakiyesi yalnızca nakit hareketleri sayar.
              </p>
            </CardContent>
          </Card>
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
          <CardContent className="pt-3">
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
            const isTodayIncome =
              values.type === "income" && values.date === todayISO();
            const nextIncome = isTodayIncome
              ? income + values.amount
              : income;
            const hitGoal =
              isTodayIncome &&
              business.dailyIncomeTarget > 0 &&
              income < business.dailyIncomeTarget &&
              nextIncome >= business.dailyIncomeTarget;

            notify({
              title: hitGoal
                ? "Günlük hedefe ulaşıldı!"
                : values.type === "income"
                  ? "Gelir eklendi"
                  : "Gider eklendi",
              description: hitGoal
                ? "Tebrikler, bugünkü gelir hedefini tamamladınız."
                : undefined,
              status: "success",
              variant: hitGoal ? "modal" : "toast",
            });
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
