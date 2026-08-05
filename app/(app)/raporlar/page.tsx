"use client";

import { GoalProgress } from "@/components/domain/goal-progress";
import { StatCard } from "@/components/domain/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import { formatMoney, todayISO } from "@/lib/utils/format";
import { paymentMethodLabels } from "@/lib/utils/labels";
import {
  daysBetweenInclusive,
  filterByDateRange,
  goalSnapshot,
  monthlyBarsForYear,
  monthlyPaceExpected,
  paymentBreakdown,
  periodRange,
  previousPeriodRange,
  sumByType,
  yearlyPaceExpected,
  type ReportPeriod,
} from "@/lib/utils/stats";
import { downloadCsv, downloadPdf, printTable } from "@/lib/utils/table";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Download,
  Percent,
  Printer,
  Scale,
  Target,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";

const periodLabels: Record<ReportPeriod, string> = {
  day: "Bugün",
  week: "Bu hafta",
  month: "Bu ay",
  year: "Bu yıl",
};

const prevLabels: Record<ReportPeriod, string> = {
  day: "Düne göre",
  week: "Geçen haftaya göre",
  month: "Geçen aya göre",
  year: "Geçen yıla göre",
};

export default function ReportsPage() {
  const { transactions, categories, business } = useAppStore();
  const { notify } = useFeedback();
  const [period, setPeriod] = useState<ReportPeriod>("day");

  const range = useMemo(() => periodRange(period), [period]);
  const prevRange = useMemo(() => previousPeriodRange(period), [period]);

  const filtered = useMemo(
    () => filterByDateRange(transactions, range.from, range.to),
    [transactions, range],
  );
  const previous = useMemo(
    () => filterByDateRange(transactions, prevRange.from, prevRange.to),
    [transactions, prevRange],
  );

  const income = sumByType(filtered, "income");
  const expense = sumByType(filtered, "expense");
  const net = income - expense;
  const prevIncome = sumByType(previous, "income");
  const incomeDelta = income - prevIncome;
  const incomeDeltaPct =
    prevIncome > 0 ? Math.round((incomeDelta / prevIncome) * 100) : null;

  const days = daysBetweenInclusive(range.from, range.to);
  const avgDailyIncome = income / days;
  const expenseRatio = income > 0 ? Math.round((expense / income) * 100) : 0;

  const payments = useMemo(() => paymentBreakdown(filtered), [filtered]);

  const periodTarget =
    period === "day"
      ? business.dailyIncomeTarget
      : period === "week"
        ? business.weeklyIncomeTarget
        : period === "month"
          ? business.monthlyIncomeTarget
          : business.yearlyIncomeTarget;

  const periodGoal = goalSnapshot(income, periodTarget);
  const paceExpected =
    period === "month"
      ? monthlyPaceExpected(business.monthlyIncomeTarget)
      : period === "year"
        ? yearlyPaceExpected(business.yearlyIncomeTarget)
        : null;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    return [...map.entries()]
      .map(([categoryId, amount]) => ({
        categoryId,
        name:
          categories.find((c) => c.id === categoryId)?.name ?? "Bilinmeyen",
        type:
          categories.find((c) => c.id === categoryId)?.type ?? "expense",
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered, categories]);

  const maxAmount = Math.max(...byCategory.map((c) => c.amount), 1);
  const topCategory = byCategory[0] ?? null;

  const chartBars = useMemo(() => {
    if (period === "year") {
      return monthlyBarsForYear(
        transactions,
        new Date().getFullYear(),
      ).map((m) => ({
        key: m.key,
        label: m.label,
        income: m.income,
        expense: m.expense,
      }));
    }

    const daysList: {
      key: string;
      label: string;
      income: number;
      expense: number;
    }[] = [];
    const start = new Date(`${range.from}T12:00:00`);
    const end = new Date(`${range.to}T12:00:00`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const dayTx = filtered.filter((t) => t.date === iso);
      daysList.push({
        key: iso,
        label: iso.slice(8),
        income: sumByType(dayTx, "income"),
        expense: sumByType(dayTx, "expense"),
      });
    }
    return daysList.slice(-31);
  }, [period, range, filtered, transactions]);

  const maxBar = Math.max(
    ...chartBars.flatMap((d) => [d.income, d.expense]),
    1,
  );

  const periodLabel = periodLabels[period];

  function buildSummaryRows() {
    const headers = ["Kalem", "Değer"];
    const rows = [
      ["Dönem", periodLabel],
      ["Aralık", `${range.from} — ${range.to}`],
      ["Gelir", formatMoney(income)],
      ["Gider", formatMoney(expense)],
      ["Net", formatMoney(net)],
      ["Günlük ort. gelir", formatMoney(avgDailyIncome)],
      ["Gider oranı", `%${expenseRatio}`],
      [
        "Önceki dönem gelir",
        formatMoney(prevIncome),
      ],
      [
        "Değişim",
        incomeDeltaPct == null
          ? formatMoney(incomeDelta)
          : `${incomeDelta >= 0 ? "+" : ""}${incomeDeltaPct}%`,
      ],
      ...payments.map((p) => [
        `${paymentMethodLabels[p.method]} net`,
        formatMoney(p.net),
      ]),
      ...byCategory.slice(0, 8).map((c) => [
        `${c.name} (${c.type === "income" ? "Gelir" : "Gider"})`,
        formatMoney(c.amount),
      ]),
    ];
    return { headers, rows };
  }

  function handleExportCsv() {
    const { headers, rows } = buildSummaryRows();
    downloadCsv(`rapor-${period}-${todayISO()}`, headers, rows);
    notify({ title: "Rapor CSV indirildi", status: "success", variant: "toast" });
  }

  async function handleExportPdf() {
    const { headers, rows } = buildSummaryRows();
    try {
      await downloadPdf({
        filename: `rapor-${period}-${todayISO()}`,
        title: `Kasa Raporu — ${periodLabel}`,
        headers,
        rows,
      });
      notify({ title: "Rapor PDF indirildi", status: "success", variant: "toast" });
    } catch {
      notify({
        title: "PDF oluşturulamadı",
        status: "error",
        variant: "toast",
      });
    }
  }

  function handlePrint() {
    const { headers, rows } = buildSummaryRows();
    printTable({
      title: `Kasa Raporu — ${periodLabel}`,
      headers,
      rows,
    });
  }

  return (
    <div>
      <PageHeader
        title="Raporlar"
        description="Dönemsel gelir, gider, hedef ve kategori özeti"
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExportCsv}
            >
              CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => void handleExportPdf()}
            >
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Yazdır
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <Tabs
          items={[
            { id: "day", label: "Gün" },
            { id: "week", label: "Hafta" },
            { id: "month", label: "Ay" },
            { id: "year", label: "Yıl" },
          ]}
          value={period}
          onChange={(id) => setPeriod(id as ReportPeriod)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`${periodLabel} gelir`}
          value={formatMoney(income)}
          hint={
            incomeDeltaPct == null
              ? `${prevLabels[period]} ${incomeDelta >= 0 ? "+" : ""}${formatMoney(incomeDelta)}`
              : `${prevLabels[period]} ${incomeDelta >= 0 ? "+" : ""}${incomeDeltaPct}%`
          }
          icon={<ArrowUpRight className="h-5 w-5" />}
          trend={incomeDelta >= 0 ? "up" : "down"}
        />
        <StatCard
          label={`${periodLabel} gider`}
          value={formatMoney(expense)}
          hint={`Gider oranı %${expenseRatio}`}
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
          label="Günlük ort. gelir"
          value={formatMoney(avgDailyIncome)}
          hint={`${days} gün üzerinden`}
          icon={<Percent className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GoalProgress
            label={`${periodLabel} gelir hedefi`}
            current={periodGoal.current}
            target={periodGoal.target}
            hint={
              paceExpected != null && periodGoal.target > 0
                ? `Tempo beklenen: ${formatMoney(paceExpected)}`
                : periodGoal.target > 0
                  ? `Kalan ${formatMoney(periodGoal.remaining)}`
                  : "Hedefi Ayarlar’dan tanımlayın"
            }
            icon={
              period === "day" ? (
                <Target className="h-5 w-5" />
              ) : period === "week" ? (
                <CalendarDays className="h-5 w-5" />
              ) : (
                <Trophy className="h-5 w-5" />
              )
            }
          />
        </div>
        <Card>
          <CardContent className="flex h-full flex-col justify-center py-5">
            <p className="text-sm text-muted">Öne çıkan kategori</p>
            {topCategory ? (
              <>
                <p className="mt-1 text-lg font-semibold text-forest">
                  {topCategory.name}
                </p>
                <p className="mt-1 text-sm tabular-nums text-muted">
                  {formatMoney(topCategory.amount)} ·{" "}
                  {topCategory.type === "income" ? "Gelir" : "Gider"}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Bu dönemde veri yok</p>
            )}
            <p className="mt-3 text-xs text-muted">
              {range.from === range.to
                ? range.from
                : `${range.from} → ${range.to}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {period === "year" ? "Aylık dağılım" : "Günlük dağılım"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartBars.every((d) => d.income === 0 && d.expense === 0) ? (
              <p className="py-8 text-center text-sm text-muted">
                Bu dönemde hareket yok.
              </p>
            ) : (
              <div className="flex h-48 items-end gap-1 sm:gap-1.5">
                {chartBars.map((d) => (
                  <div
                    key={d.key}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1"
                    title={`${d.key}: +${formatMoney(d.income)} / −${formatMoney(d.expense)}`}
                  >
                    <div className="flex h-40 w-full items-end justify-center gap-0.5">
                      <div
                        className="w-1/2 max-w-3 rounded-t bg-apple"
                        style={{
                          height: `${Math.max((d.income / maxBar) * 100, d.income ? 4 : 0)}%`,
                        }}
                      />
                      <div
                        className="w-1/2 max-w-3 rounded-t bg-olive/70"
                        style={{
                          height: `${Math.max((d.expense / maxBar) * 100, d.expense ? 4 : 0)}%`,
                        }}
                      />
                    </div>
                    <span className="truncate text-[10px] text-muted">
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-apple" /> Gelir
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-olive/70" /> Gider
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategori kırılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Bu dönemde kategori verisi yok.
              </p>
            ) : (
              <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {byCategory.map((item) => (
                  <li key={item.categoryId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-forest">
                        {item.name}
                        <span className="ml-2 text-xs font-normal text-muted">
                          {item.type === "income" ? "Gelir" : "Gider"}
                        </span>
                      </span>
                      <span className="tabular-nums text-forest">
                        {formatMoney(item.amount)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted-light">
                      <div
                        className={
                          item.type === "income"
                            ? "h-full rounded-full bg-apple"
                            : "h-full rounded-full bg-olive"
                        }
                        style={{
                          width: `${(item.amount / maxAmount) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Ödeme yöntemi özeti</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-3 sm:grid-cols-3">
            {payments.map((p) => (
              <div
                key={p.method}
                className="rounded-xl border border-border bg-cream/40 px-4 py-3"
              >
                <p className="text-sm font-medium text-forest">
                  {paymentMethodLabels[p.method]}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Gelir {formatMoney(p.income)}
                </p>
                <p className="text-xs text-muted">
                  Gider {formatMoney(p.expense)}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-forest">
                  Net {formatMoney(p.net)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
