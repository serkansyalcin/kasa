import type {
  BusinessInfo,
  CashSession,
  Category,
  DiningTable,
  Product,
  Purchase,
  Sale,
  TableOrder,
  Transaction,
} from "@/lib/types";
import { todayISO } from "@/lib/utils/format";

const today = todayISO();

export const businessInfo: BusinessInfo = {
  name: "Yeşil Bahçe Cafe",
  email: "demo@kasatakip.com",
  defaultOpeningBalance: 1500,
  dailyIncomeTarget: 5000,
  weeklyIncomeTarget: 30000,
  monthlyIncomeTarget: 120000,
  yearlyIncomeTarget: 1400000,
};

export const seedCategories: Category[] = [
  { id: "cat_satis", name: "Satış", type: "income", color: "#8BBC15" },
  { id: "cat_nakit", name: "Nakit Tahsilat", type: "income", color: "#A2DC18" },
  { id: "cat_diger_gelir", name: "Diğer Gelir", type: "income", color: "#537528" },
  { id: "cat_alis", name: "Alış / Tedarik", type: "expense", color: "#045131" },
  { id: "cat_malzeme", name: "Malzeme", type: "expense", color: "#045131" },
  { id: "cat_kira", name: "Kira", type: "expense", color: "#537528" },
  { id: "cat_personel", name: "Personel", type: "expense", color: "#8BBC15" },
  { id: "cat_fatura", name: "Fatura", type: "expense", color: "#045131" },
  { id: "cat_diger_gider", name: "Diğer Gider", type: "expense", color: "#537528" },
];

export const seedProducts: Product[] = [
  {
    id: "prd_kahve",
    name: "Filtre Kahve",
    sellPrice: 90,
    buyPrice: 0,
    kind: "sell",
    active: true,
  },
  {
    id: "prd_latte",
    name: "Latte",
    sellPrice: 120,
    buyPrice: 0,
    kind: "sell",
    active: true,
  },
  {
    id: "prd_cay",
    name: "Çay",
    sellPrice: 40,
    buyPrice: 0,
    kind: "sell",
    active: true,
  },
  {
    id: "prd_su",
    name: "Su",
    sellPrice: 25,
    buyPrice: 8,
    kind: "both",
    active: true,
  },
  {
    id: "prd_sandvic",
    name: "Sandviç",
    sellPrice: 180,
    buyPrice: 0,
    kind: "sell",
    active: true,
  },
  {
    id: "prd_sut",
    name: "Süt (L)",
    sellPrice: 0,
    buyPrice: 45,
    kind: "buy",
    active: true,
  },
  {
    id: "prd_kahvecekirdek",
    name: "Kahve çekirdeği (kg)",
    sellPrice: 0,
    buyPrice: 650,
    kind: "buy",
    active: true,
  },
  {
    id: "prd_seker",
    name: "Şeker (kg)",
    sellPrice: 0,
    buyPrice: 55,
    kind: "buy",
    active: true,
  },
];

export const seedSales: Sale[] = [];
export const seedPurchases: Purchase[] = [];

export const seedTables: DiningTable[] = [
  { id: "tbl_1", name: "Masa 1", capacity: 2, sortOrder: 1, active: true },
  { id: "tbl_2", name: "Masa 2", capacity: 2, sortOrder: 2, active: true },
  { id: "tbl_3", name: "Masa 3", capacity: 4, sortOrder: 3, active: true },
  { id: "tbl_4", name: "Masa 4", capacity: 4, sortOrder: 4, active: true },
  { id: "tbl_5", name: "Masa 5", capacity: 4, sortOrder: 5, active: true },
  { id: "tbl_6", name: "Masa 6", capacity: 4, sortOrder: 6, active: true },
  { id: "tbl_7", name: "Masa 7", capacity: 6, sortOrder: 7, active: true },
  { id: "tbl_8", name: "Masa 8", capacity: 6, sortOrder: 8, active: true },
];

export const seedTableOrders: TableOrder[] = [];

export const seedTransactions: Transaction[] = [
  {
    id: "tx_1",
    type: "income",
    amount: 2450,
    categoryId: "cat_satis",
    description: "Sabah satışları",
    date: today,
    createdAt: `${today}T09:15:00`,
    paymentMethod: "cash",
  },
  {
    id: "tx_2",
    type: "income",
    amount: 890,
    categoryId: "cat_satis",
    description: "Öğle satışları",
    date: today,
    createdAt: `${today}T13:40:00`,
    paymentMethod: "card",
  },
  {
    id: "tx_3",
    type: "expense",
    amount: 320,
    categoryId: "cat_malzeme",
    description: "Süt ve kahve siparişi",
    date: today,
    createdAt: `${today}T10:05:00`,
    paymentMethod: "cash",
  },
  {
    id: "tx_4",
    type: "expense",
    amount: 85,
    categoryId: "cat_diger_gider",
    description: "Temizlik malzemesi",
    date: today,
    createdAt: `${today}T11:20:00`,
    paymentMethod: "cash",
  },
  {
    id: "tx_5",
    type: "income",
    amount: 1560,
    categoryId: "cat_satis",
    description: "Akşam satışları",
    date: today,
    createdAt: `${today}T18:30:00`,
    paymentMethod: "card",
  },
  {
    id: "tx_6",
    type: "income",
    amount: 2100,
    categoryId: "cat_satis",
    description: "Günlük satış",
    date: offsetDate(-1),
    createdAt: `${offsetDate(-1)}T20:00:00`,
    paymentMethod: "cash",
  },
  {
    id: "tx_7",
    type: "expense",
    amount: 450,
    categoryId: "cat_malzeme",
    description: "Pastane malzemesi",
    date: offsetDate(-1),
    createdAt: `${offsetDate(-1)}T14:00:00`,
    paymentMethod: "transfer",
  },
  {
    id: "tx_8",
    type: "expense",
    amount: 12000,
    categoryId: "cat_kira",
    description: "Aylık kira",
    date: offsetDate(-3),
    createdAt: `${offsetDate(-3)}T09:00:00`,
    paymentMethod: "transfer",
  },
  {
    id: "tx_9",
    type: "income",
    amount: 3800,
    categoryId: "cat_satis",
    description: "Hafta sonu satış",
    date: offsetDate(-2),
    createdAt: `${offsetDate(-2)}T21:00:00`,
    paymentMethod: "card",
  },
  {
    id: "tx_10",
    type: "expense",
    amount: 2400,
    categoryId: "cat_personel",
    description: "Haftalık avans",
    date: offsetDate(-4),
    createdAt: `${offsetDate(-4)}T17:00:00`,
    paymentMethod: "cash",
  },
];

export const seedCashSessions: CashSession[] = [
  {
    id: "cs_open",
    openedAt: `${today}T08:00:00`,
    openingBalance: 1500,
    status: "open",
    note: "Güne başlangıç",
  },
  {
    id: "cs_1",
    openedAt: `${offsetDate(-1)}T08:00:00`,
    closedAt: `${offsetDate(-1)}T23:10:00`,
    openingBalance: 1200,
    closingBalance: 2850,
    countedBalance: 2840,
    difference: -10,
    status: "closed",
    note: "Küçük fark",
  },
  {
    id: "cs_2",
    openedAt: `${offsetDate(-2)}T08:30:00`,
    closedAt: `${offsetDate(-2)}T22:45:00`,
    openingBalance: 1000,
    closingBalance: 3200,
    countedBalance: 3200,
    difference: 0,
    status: "closed",
  },
  {
    id: "cs_3",
    openedAt: `${offsetDate(-3)}T08:00:00`,
    closedAt: `${offsetDate(-3)}T23:00:00`,
    openingBalance: 1500,
    closingBalance: 2100,
    countedBalance: 2115,
    difference: 15,
    status: "closed",
  },
];

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
