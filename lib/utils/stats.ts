import type { CashSession, PaymentMethod, Transaction } from "@/lib/types";
import { todayISO } from "./format";

export function sumByType(
  transactions: Transaction[],
  type: "income" | "expense",
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function sumByPayment(
  transactions: Transaction[],
  method: PaymentMethod,
): number {
  return transactions
    .filter((t) => (t.paymentMethod ?? "cash") === method)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function filterByDateRange(
  transactions: Transaction[],
  from: string,
  to: string,
): Transaction[] {
  return transactions.filter((t) => t.date >= from && t.date <= to);
}

export function todayTransactions(transactions: Transaction[]): Transaction[] {
  const today = todayISO();
  return transactions.filter((t) => t.date === today);
}

/** Fiziksel kasa: yalnızca nakit hareketler */
export function expectedCashBalance(
  session: CashSession | null,
  transactions: Transaction[],
): number | null {
  if (!session) return null;
  const day = session.openedAt.slice(0, 10);
  const dayCash = transactions.filter(
    (t) => t.date === day && (t.paymentMethod ?? "cash") === "cash",
  );
  const income = sumByType(dayCash, "income");
  const expense = sumByType(dayCash, "expense");
  return session.openingBalance + income - expense;
}

export function paymentBreakdown(transactions: Transaction[]) {
  const methods: PaymentMethod[] = ["cash", "card", "transfer"];
  return methods.map((method) => {
    const list = transactions.filter(
      (t) => (t.paymentMethod ?? "cash") === method,
    );
    return {
      method,
      income: sumByType(list, "income"),
      expense: sumByType(list, "expense"),
      net: sumByType(list, "income") - sumByType(list, "expense"),
    };
  });
}

export function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISO(d);
}

export function startOfMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  return toISO(d);
}

export function startOfYearISO(): string {
  const d = new Date();
  d.setMonth(0, 1);
  return toISO(d);
}

export type ReportPeriod = "day" | "week" | "month" | "year";

export function periodRange(period: ReportPeriod): { from: string; to: string } {
  const to = todayISO();
  if (period === "day") return { from: to, to };
  if (period === "week") return { from: startOfWeekISO(), to };
  if (period === "month") return { from: startOfMonthISO(), to };
  return { from: startOfYearISO(), to };
}

/** Seçili dönemin bir önceki eşdeğer aralığı */
export function previousPeriodRange(period: ReportPeriod): {
  from: string;
  to: string;
} {
  const now = new Date();
  if (period === "day") {
    const d = offsetDateISO(-1);
    return { from: d, to: d };
  }
  if (period === "week") {
    const prevEnd = new Date(`${startOfWeekISO()}T12:00:00`);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 6);
    return { from: toISO(prevStart), to: toISO(prevEnd) };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toISO(start), to: toISO(end) };
  }
  const start = new Date(now.getFullYear() - 1, 0, 1);
  const end = new Date(now.getFullYear() - 1, 11, 31);
  return { from: toISO(start), to: toISO(end) };
}

export function daysBetweenInclusive(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`).getTime();
  const b = new Date(`${to}T12:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export function monthlyBarsForYear(
  transactions: Transaction[],
  year: number,
): { key: string; label: string; income: number; expense: number }[] {
  const labels = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];
  return labels.map((label, index) => {
    const month = String(index + 1).padStart(2, "0");
    const prefix = `${year}-${month}`;
    const list = transactions.filter((t) => t.date.startsWith(prefix));
    return {
      key: prefix,
      label,
      income: sumByType(list, "income"),
      expense: sumByType(list, "expense"),
    };
  });
}

export function yearlyPaceExpected(yearlyTarget: number): number {
  if (yearlyTarget <= 0) return 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const dayOfYear =
    Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  const isLeap =
    (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) ||
    now.getFullYear() % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;
  return (yearlyTarget / daysInYear) * dayOfYear;
}

export function offsetDateISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function yesterdayTransactions(
  transactions: Transaction[],
): Transaction[] {
  const day = offsetDateISO(-1);
  return transactions.filter((t) => t.date === day);
}

export function monthTransactions(transactions: Transaction[]): Transaction[] {
  const from = startOfMonthISO();
  const to = todayISO();
  return filterByDateRange(transactions, from, to);
}

export function weekTransactions(transactions: Transaction[]): Transaction[] {
  const from = startOfWeekISO();
  const to = todayISO();
  return filterByDateRange(transactions, from, to);
}

export type GoalSnapshot = {
  current: number;
  target: number;
  remaining: number;
  percent: number;
  reached: boolean;
  /** Aylık hedef için: takvim temposuna göre olması gereken tutar */
  paceExpected?: number;
  aheadOfPace?: boolean;
};

export function goalSnapshot(current: number, target: number): GoalSnapshot {
  const safeTarget = Math.max(0, target);
  const percent =
    safeTarget > 0 ? Math.round((current / safeTarget) * 100) : 0;
  return {
    current,
    target: safeTarget,
    remaining: Math.max(safeTarget - current, 0),
    percent,
    reached: safeTarget > 0 && current >= safeTarget,
  };
}

/** Ayın bugüne kadarki beklenen tempo tutarı */
export function monthlyPaceExpected(monthlyTarget: number): number {
  if (monthlyTarget <= 0) return 0;
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  return (monthlyTarget / daysInMonth) * day;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
