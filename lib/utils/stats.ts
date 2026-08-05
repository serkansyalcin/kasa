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
