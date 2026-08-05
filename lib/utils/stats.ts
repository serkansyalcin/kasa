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

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
