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
    trackStock: true,
    stockQty: 40,
    lowStockAt: 10,
    unit: "adet",
  },
  {
    id: "prd_latte",
    name: "Latte",
    sellPrice: 120,
    buyPrice: 0,
    kind: "sell",
    active: true,
    trackStock: false,
    stockQty: 0,
    lowStockAt: 0,
    unit: "adet",
  },
  {
    id: "prd_cay",
    name: "Çay",
    sellPrice: 40,
    buyPrice: 0,
    kind: "sell",
    active: true,
    trackStock: true,
    stockQty: 80,
    lowStockAt: 15,
    unit: "adet",
  },
  {
    id: "prd_su",
    name: "Su",
    sellPrice: 25,
    buyPrice: 8,
    kind: "both",
    active: true,
    trackStock: true,
    stockQty: 48,
    lowStockAt: 12,
    unit: "adet",
  },
  {
    id: "prd_sandvic",
    name: "Sandviç",
    sellPrice: 180,
    buyPrice: 0,
    kind: "sell",
    active: true,
    trackStock: true,
    stockQty: 12,
    lowStockAt: 3,
    unit: "adet",
  },
  {
    id: "prd_sut",
    name: "Süt (L)",
    sellPrice: 0,
    buyPrice: 45,
    kind: "buy",
    active: true,
    trackStock: true,
    stockQty: 20,
    lowStockAt: 5,
    unit: "L",
  },
  {
    id: "prd_kahvecekirdek",
    name: "Kahve çekirdeği (kg)",
    sellPrice: 0,
    buyPrice: 650,
    kind: "buy",
    active: true,
    trackStock: true,
    stockQty: 5,
    lowStockAt: 1,
    unit: "kg",
  },
  {
    id: "prd_seker",
    name: "Şeker (kg)",
    sellPrice: 0,
    buyPrice: 55,
    kind: "buy",
    active: true,
    trackStock: true,
    stockQty: 8,
    lowStockAt: 2,
    unit: "kg",
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
    amount: 420,
    categoryId: "cat_malzeme",
    description: "Süt ve şeker",
    date: today,
    createdAt: `${today}T08:30:00`,
    paymentMethod: "cash",
  },
  {
    id: "tx_4",
    type: "expense",
    amount: 1500,
    categoryId: "cat_kira",
    description: "Haftalık kira payı",
    date: today,
    createdAt: `${today}T10:00:00`,
    paymentMethod: "transfer",
  },
  {
    id: "tx_5",
    type: "income",
    amount: 320,
    categoryId: "cat_diger_gelir",
    description: "Etkinlik katılım",
    date: today,
    createdAt: `${today}T16:20:00`,
    paymentMethod: "cash",
  },
];

export const seedCashSessions: CashSession[] = [
  {
    id: "cs_open",
    openedAt: `${today}T08:00:00`,
    openingBalance: 1500,
    status: "open",
    note: "Gün başlangıcı",
  },
];
