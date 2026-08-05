"use client";

import { GoalProgress } from "@/components/domain/goal-progress";
import { StatCard } from "@/components/domain/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store/app-store";
import { formatMoney, todayISO } from "@/lib/utils/format";
import { paymentMethodLabels } from "@/lib/utils/labels";
import {
  filterByDateRange,
  goalSnapshot,
  monthlyPaceExpected,
  paymentBreakdown,
  startOfMonthISO,
  startOfWeekISO,
  sumByType,
} from "@/lib/utils/stats";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Scale,
  Target,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";

type Period = "day" | "week" | "month";

export default function ReportsPage() {
  const { transactions, categories, business } = useAppStore();
  const [period, setPeriod] = useState<Period>("day");

  const range = useMemo(() => {
    const to = todayISO();
    if (period === "day") return { from: to, to };
    if (period === "week") return { from: startOfWeekISO(), to };
    return { from: startOfMonthISO(), to };
  }, [period]);

  const filtered = useMemo(
    () => filterByDateRange(transactions, range.from, range.to),
    [transactions, range],
  );

  const income = sumByType(filtered, "income");
  const expense = sumByType(filtered, "expense");
  const net = income - expense;
  const payments = useMemo(() => paymentBreakdown(filtered), [filtered]);

  const periodTarget =
    period === "day"
      ? business.dailyIncomeTarget
      : period === "week"
        ? business.weeklyIncomeTarget
        : business.monthlyIncomeTarget;
  const periodGoal = goalSnapshot(income, periodTarget);
  const paceExpected = monthlyPaceExpected(business.monthlyIncomeTarget);

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

  const dailyBars = useMemo(() => {
    const days: { date: string; income: number; expense: number }[] = [];
    const start = new Date(`${range.from}T12:00:00`);
    const end = new Date(`${range.to}T12:00:00`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const dayTx = filtered.filter((t) => t.date === iso);
      days.push({
        date: iso,
        income: sumByType(dayTx, "income"),
        expense: sumByType(dayTx, "expense"),
      });
    }
    return days.slice(-14);
  }, [filtered, range]);

  const maxBar = Math.max(
    ...dailyBars.flatMap((d) => [d.income, d.expense]),
    1,
  );

  const periodLabel =
    period === "day" ? "Bugün" : period === "week" ? "Bu hafta" : "Bu ay";

  return (
    <div>
      <PageHeader
        title="Raporlar"
        description="Dönemsel gelir, gider ve kategori özeti"
      />

      <div className="mb-6">
        <Tabs
          items={[
            { id: "day", label: "Gün" },
            { id: "week", label: "Hafta" },
            { id: "month", label: "Ay" },
          ]}
          value={period}
          onChange={(id) => setPeriod(id as Period)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={`${periodLabel} gelir`}
          value={formatMoney(income)}
          icon={<ArrowUpRight className="h-5 w-5" />}
          trend="up"
        />
        <StatCard
          label={`${periodLabel} gider`}
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
      </div>

      <div className="mt-6">
        <GoalProgress
          label={`${periodLabel} gelir hedefi`}
          current={periodGoal.current}
          target={periodGoal.target}
          hint={
            period === "month" && periodGoal.target > 0
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Günlük dağılım</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyBars.every((d) => d.income === 0 && d.expense === 0) ? (
              <p className="py-8 text-center text-sm text-muted">
                Bu dönemde hareket yok.
              </p>
            ) : (
              <div className="flex h-48 items-end gap-1.5 sm:gap-2">
                {dailyBars.map((d) => (
                  <div
                    key={d.date}
                    className="flex flex-1 flex-col items-center gap-1"
                    title={`${d.date}: +${formatMoney(d.income)} / −${formatMoney(d.expense)}`}
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
                    <span className="text-[10px] text-muted">
                      {d.date.slice(8)}
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
              <ul className="space-y-3">
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
        <CardContent className="pt-0">
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
