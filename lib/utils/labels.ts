import type { PaymentMethod, TransactionType } from "@/lib/types";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Nakit",
  card: "Kart",
  transfer: "Havale/EFT",
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  income: "Gelir",
  expense: "Gider",
};

export function paymentMethodLabel(method: PaymentMethod | undefined): string {
  return paymentMethodLabels[method ?? "cash"];
}
