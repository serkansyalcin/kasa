export type TransactionType = "income" | "expense";

export type PaymentMethod = "cash" | "card" | "transfer";

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  color?: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string; // ISO date YYYY-MM-DD
  createdAt: string; // ISO datetime
  paymentMethod: PaymentMethod;
};

export type CashSessionStatus = "open" | "closed";

export type CashSession = {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  closingBalance?: number;
  countedBalance?: number;
  difference?: number;
  note?: string;
  status: CashSessionStatus;
};

export type BusinessInfo = {
  name: string;
  email: string;
  defaultOpeningBalance: number;
};
