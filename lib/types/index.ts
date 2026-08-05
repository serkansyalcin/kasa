export type TransactionType = "income" | "expense";

export type PaymentMethod = "cash" | "card" | "transfer";

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  color?: string;
};

export type TransactionSource = "manual" | "sale" | "purchase";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string; // ISO date YYYY-MM-DD
  createdAt: string; // ISO datetime
  paymentMethod: PaymentMethod;
  source?: TransactionSource;
  sourceId?: string;
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
  dailyIncomeTarget: number;
  weeklyIncomeTarget: number;
  monthlyIncomeTarget: number;
  yearlyIncomeTarget: number;
};

/** sell: satışta, buy: alışta, both: ikisinde */
export type ProductKind = "sell" | "buy" | "both";

export type Product = {
  id: string;
  name: string;
  sellPrice: number;
  buyPrice: number;
  kind: ProductKind;
  active: boolean;
};

export type DocLine = {
  id: string;
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export type Sale = {
  id: string;
  date: string;
  paymentMethod: PaymentMethod;
  note?: string;
  lines: DocLine[];
  total: number;
  transactionId: string;
  createdAt: string;
  tableId?: string;
  tableName?: string;
};

export type DiningTable = {
  id: string;
  name: string;
  capacity: number;
  sortOrder: number;
  active: boolean;
};

export type TableOrderStatus = "open" | "paid" | "cancelled";

export type TableOrder = {
  id: string;
  tableId: string;
  status: TableOrderStatus;
  lines: DocLine[];
  note?: string;
  guestCount?: number;
  openedAt: string;
  closedAt?: string;
  saleId?: string;
};

export type Purchase = {
  id: string;
  date: string;
  paymentMethod: PaymentMethod;
  supplier?: string;
  note?: string;
  lines: DocLine[];
  total: number;
  transactionId: string;
  createdAt: string;
};

export const SALE_CATEGORY_ID = "cat_satis";
export const PURCHASE_CATEGORY_ID = "cat_alis";

export function lineTotal(line: DocLine): number {
  return Math.round(line.qty * line.unitPrice * 100) / 100;
}

export function docTotal(lines: DocLine[]): number {
  return Math.round(lines.reduce((s, l) => s + lineTotal(l), 0) * 100) / 100;
}
