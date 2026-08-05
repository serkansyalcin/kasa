import type { CashSession, Transaction } from "@/lib/types";
import { todayISO } from "./format";

export function sumByType(
  transactions: Transaction[],
  type: "income" | "expense",
): number {
  return transactions
    .filter((t) => t.type === type)
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

export function expectedCashBalance(
  session: CashSession | null,
  transactions: Transaction[],
): number | null {
  if (!session) return null;
  const day = session.openedAt.slice(0, 10);
  const dayTx = transactions.filter((t) => t.date === day);
  const income = sumByType(dayTx, "income");
  const expense = sumByType(dayTx, "expense");
  return session.openingBalance + income - expense;
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

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
