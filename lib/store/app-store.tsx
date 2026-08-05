"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  businessInfo,
  seedCashSessions,
  seedCategories,
  seedProducts,
  seedPurchases,
  seedSales,
  seedTransactions,
} from "@/lib/mock/data";
import type {
  BusinessInfo,
  CashSession,
  Category,
  DocLine,
  PaymentMethod,
  Product,
  ProductKind,
  Purchase,
  Sale,
  Transaction,
  TransactionType,
} from "@/lib/types";
import {
  PURCHASE_CATEGORY_ID,
  SALE_CATEGORY_ID,
  docTotal,
} from "@/lib/types";
import { todayISO, uid } from "@/lib/utils/format";
import { expectedCashBalance } from "@/lib/utils/stats";
import { AUTH_KEY, DATA_KEY, loadJSON, removeKey, saveJSON } from "./storage";

type AppData = {
  categories: Category[];
  transactions: Transaction[];
  cashSessions: CashSession[];
  business: BusinessInfo;
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
};

type TransactionInput = {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  source?: Transaction["source"];
  sourceId?: string;
};

type CategoryInput = {
  name: string;
  type: TransactionType;
};

type ProductInput = {
  name: string;
  sellPrice: number;
  buyPrice: number;
  kind: ProductKind;
  active?: boolean;
};

type SaleInput = {
  date: string;
  paymentMethod: PaymentMethod;
  note?: string;
  lines: Omit<DocLine, "id">[];
};

type PurchaseInput = {
  date: string;
  paymentMethod: PaymentMethod;
  supplier?: string;
  note?: string;
  lines: Omit<DocLine, "id">[];
};

type AppStore = {
  hydrated: boolean;
  isAuthenticated: boolean;
  business: BusinessInfo;
  categories: Category[];
  transactions: Transaction[];
  cashSessions: CashSession[];
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  openSession: CashSession | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (input: CategoryInput) => void;
  updateCategory: (id: string, input: CategoryInput) => void;
  deleteCategory: (id: string) => void;
  openCash: (openingBalance: number, note?: string) => void;
  closeCash: (countedBalance: number, note?: string) => void;
  updateBusiness: (patch: Partial<BusinessInfo>) => void;
  exportBackup: () => string;
  importBackup: (json: string) => { ok: true } | { ok: false; error: string };
  resetData: () => void;
  addProduct: (input: ProductInput) => void;
  updateProduct: (id: string, input: ProductInput) => void;
  deleteProduct: (id: string) => void;
  createSale: (
    input: SaleInput,
  ) => { ok: true; sale: Sale } | { ok: false; error: string };
  deleteSale: (id: string) => void;
  createPurchase: (
    input: PurchaseInput,
  ) => { ok: true; purchase: Purchase } | { ok: false; error: string };
  deletePurchase: (id: string) => void;
};

const defaultData: AppData = {
  categories: seedCategories,
  transactions: seedTransactions,
  cashSessions: seedCashSessions,
  business: businessInfo,
  products: seedProducts,
  sales: seedSales,
  purchases: seedPurchases,
};

type StoreSnapshot = {
  hydrated: boolean;
  isAuthenticated: boolean;
  data: AppData;
};

const serverSnapshot: StoreSnapshot = {
  hydrated: false,
  isAuthenticated: false,
  data: defaultData,
};

let snapshot: StoreSnapshot = serverSnapshot;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function migrateCategories(categories: Category[]): Category[] {
  const list = [...categories];
  if (!list.some((c) => c.id === PURCHASE_CATEGORY_ID)) {
    list.splice(3, 0, {
      id: PURCHASE_CATEGORY_ID,
      name: "Alış / Tedarik",
      type: "expense",
      color: "#045131",
    });
  }
  return list;
}

function migrateData(raw: AppData): AppData {
  return {
    ...raw,
    business: {
      ...businessInfo,
      ...raw.business,
      defaultOpeningBalance:
        raw.business?.defaultOpeningBalance ??
        businessInfo.defaultOpeningBalance,
      dailyIncomeTarget:
        raw.business?.dailyIncomeTarget ?? businessInfo.dailyIncomeTarget,
      weeklyIncomeTarget:
        raw.business?.weeklyIncomeTarget ?? businessInfo.weeklyIncomeTarget,
      monthlyIncomeTarget:
        raw.business?.monthlyIncomeTarget ?? businessInfo.monthlyIncomeTarget,
      yearlyIncomeTarget:
        raw.business?.yearlyIncomeTarget ?? businessInfo.yearlyIncomeTarget,
    },
    transactions: (raw.transactions ?? []).map((t) => ({
      ...t,
      paymentMethod: t.paymentMethod ?? "cash",
      source: t.source ?? "manual",
    })),
    categories: migrateCategories(raw.categories ?? seedCategories),
    cashSessions: raw.cashSessions ?? seedCashSessions,
    products: raw.products?.length ? raw.products : seedProducts,
    sales: raw.sales ?? [],
    purchases: raw.purchases ?? [],
  };
}

function ensureClientInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const auth = loadJSON<{ loggedIn: boolean } | null>(AUTH_KEY, null);
  const loaded = loadJSON<AppData>(DATA_KEY, defaultData);
  snapshot = {
    hydrated: true,
    isAuthenticated: Boolean(auth?.loggedIn),
    data: migrateData(loaded),
  };
}

function getSnapshot(): StoreSnapshot {
  ensureClientInit();
  return snapshot;
}

function getServerSnapshot(): StoreSnapshot {
  return serverSnapshot;
}

function setAuthenticated(value: boolean) {
  snapshot = { ...snapshot, isAuthenticated: value, hydrated: true };
  emit();
}

function setData(updater: AppData | ((prev: AppData) => AppData)) {
  const next =
    typeof updater === "function"
      ? (updater as (prev: AppData) => AppData)(snapshot.data)
      : updater;
  snapshot = { ...snapshot, data: next, hydrated: true };
  saveJSON(DATA_KEY, next);
  emit();
}

function normalizeLines(lines: Omit<DocLine, "id">[]): DocLine[] {
  return lines
    .filter((l) => l.name.trim() && l.qty > 0 && l.unitPrice >= 0)
    .map((l) => ({
      id: uid("ln"),
      productId: l.productId,
      name: l.name.trim(),
      qty: l.qty,
      unitPrice: l.unitPrice,
    }));
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = useCallback((email: string, password: string) => {
    void password;
    if (!email.trim()) return false;
    saveJSON(AUTH_KEY, { loggedIn: true, email });
    setAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    removeKey(AUTH_KEY);
    setAuthenticated(false);
  }, []);

  const addTransaction = useCallback((input: TransactionInput) => {
    const tx: Transaction = {
      id: uid("tx"),
      source: input.source ?? "manual",
      ...input,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      transactions: [tx, ...prev.transactions],
    }));
  }, []);

  const updateTransaction = useCallback((id: string, input: TransactionInput) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, ...input, source: input.source ?? t.source } : t,
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((prev) => {
      const tx = prev.transactions.find((t) => t.id === id);
      return {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        sales:
          tx?.source === "sale"
            ? prev.sales.filter((s) => s.transactionId !== id)
            : prev.sales,
        purchases:
          tx?.source === "purchase"
            ? prev.purchases.filter((p) => p.transactionId !== id)
            : prev.purchases,
      };
    });
  }, []);

  const addCategory = useCallback((input: CategoryInput) => {
    const cat: Category = { id: uid("cat"), ...input };
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, cat],
    }));
  }, []);

  const updateCategory = useCallback((id: string, input: CategoryInput) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, ...input } : c,
      ),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  }, []);

  const openCash = useCallback((openingBalance: number, note?: string) => {
    setData((prev) => {
      if (prev.cashSessions.some((s) => s.status === "open")) return prev;
      const session: CashSession = {
        id: uid("cs"),
        openedAt: new Date().toISOString(),
        openingBalance,
        status: "open",
        note,
      };
      return { ...prev, cashSessions: [session, ...prev.cashSessions] };
    });
  }, []);

  const closeCash = useCallback((countedBalance: number, note?: string) => {
    setData((prev) => {
      const open = prev.cashSessions.find((s) => s.status === "open");
      if (!open) return prev;

      const closingBalance =
        expectedCashBalance(open, prev.transactions) ?? open.openingBalance;
      const difference = countedBalance - closingBalance;

      return {
        ...prev,
        cashSessions: prev.cashSessions.map((s) =>
          s.id === open.id
            ? {
                ...s,
                status: "closed" as const,
                closedAt: new Date().toISOString(),
                closingBalance,
                countedBalance,
                difference,
                note: note ?? s.note,
              }
            : s,
        ),
      };
    });
  }, []);

  const updateBusiness = useCallback((patch: Partial<BusinessInfo>) => {
    setData((prev) => ({
      ...prev,
      business: { ...prev.business, ...patch },
    }));
  }, []);

  const addProduct = useCallback((input: ProductInput) => {
    const product: Product = {
      id: uid("prd"),
      name: input.name.trim(),
      sellPrice: input.sellPrice,
      buyPrice: input.buyPrice,
      kind: input.kind,
      active: input.active ?? true,
    };
    setData((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));
  }, []);

  const updateProduct = useCallback((id: string, input: ProductInput) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id
          ? {
              ...p,
              name: input.name.trim(),
              sellPrice: input.sellPrice,
              buyPrice: input.buyPrice,
              kind: input.kind,
              active: input.active ?? p.active,
            }
          : p,
      ),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  }, []);

  const createSale = useCallback((input: SaleInput) => {
    const lines = normalizeLines(input.lines);
    if (lines.length === 0) {
      return { ok: false as const, error: "En az bir ürün ekleyin." };
    }
    const total = docTotal(lines);
    if (total <= 0) {
      return { ok: false as const, error: "Satış tutarı sıfır olamaz." };
    }

    const saleId = uid("sale");
    const txId = uid("tx");
    const summary = lines
      .slice(0, 3)
      .map((l) => `${l.qty}× ${l.name}`)
      .join(", ");
    const more = lines.length > 3 ? ` +${lines.length - 3}` : "";

    const tx: Transaction = {
      id: txId,
      type: "income",
      amount: total,
      categoryId: SALE_CATEGORY_ID,
      description: `Satış: ${summary}${more}`,
      date: input.date || todayISO(),
      createdAt: new Date().toISOString(),
      paymentMethod: input.paymentMethod,
      source: "sale",
      sourceId: saleId,
    };

    const sale: Sale = {
      id: saleId,
      date: input.date || todayISO(),
      paymentMethod: input.paymentMethod,
      note: input.note?.trim() || undefined,
      lines,
      total,
      transactionId: txId,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      sales: [sale, ...prev.sales],
      transactions: [tx, ...prev.transactions],
    }));

    return { ok: true as const, sale };
  }, []);

  const deleteSale = useCallback((id: string) => {
    setData((prev) => {
      const sale = prev.sales.find((s) => s.id === id);
      if (!sale) return prev;
      return {
        ...prev,
        sales: prev.sales.filter((s) => s.id !== id),
        transactions: prev.transactions.filter(
          (t) => t.id !== sale.transactionId,
        ),
      };
    });
  }, []);

  const createPurchase = useCallback((input: PurchaseInput) => {
    const lines = normalizeLines(input.lines);
    if (lines.length === 0) {
      return { ok: false as const, error: "En az bir kalem ekleyin." };
    }
    const total = docTotal(lines);
    if (total <= 0) {
      return { ok: false as const, error: "Alış tutarı sıfır olamaz." };
    }

    const purchaseId = uid("pur");
    const txId = uid("tx");
    const supplier = input.supplier?.trim();
    const summary = lines
      .slice(0, 3)
      .map((l) => `${l.qty}× ${l.name}`)
      .join(", ");

    const tx: Transaction = {
      id: txId,
      type: "expense",
      amount: total,
      categoryId: PURCHASE_CATEGORY_ID,
      description: supplier
        ? `Alış (${supplier}): ${summary}`
        : `Alış: ${summary}`,
      date: input.date || todayISO(),
      createdAt: new Date().toISOString(),
      paymentMethod: input.paymentMethod,
      source: "purchase",
      sourceId: purchaseId,
    };

    const purchase: Purchase = {
      id: purchaseId,
      date: input.date || todayISO(),
      paymentMethod: input.paymentMethod,
      supplier: supplier || undefined,
      note: input.note?.trim() || undefined,
      lines,
      total,
      transactionId: txId,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      purchases: [purchase, ...prev.purchases],
      transactions: [tx, ...prev.transactions],
    }));

    return { ok: true as const, purchase };
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setData((prev) => {
      const purchase = prev.purchases.find((p) => p.id === id);
      if (!purchase) return prev;
      return {
        ...prev,
        purchases: prev.purchases.filter((p) => p.id !== id),
        transactions: prev.transactions.filter(
          (t) => t.id !== purchase.transactionId,
        ),
      };
    });
  }, []);

  const exportBackup = useCallback(() => {
    return JSON.stringify(
      {
        version: 2,
        exportedAt: new Date().toISOString(),
        data: snapshot.data,
      },
      null,
      2,
    );
  }, []);

  const importBackup = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as { data?: AppData } & AppData;
      const raw = parsed.data ?? (parsed as AppData);
      if (!raw.transactions || !raw.categories || !raw.business) {
        return { ok: false as const, error: "Geçersiz yedek dosyası." };
      }
      setData(migrateData(raw));
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: "JSON okunamadı." };
    }
  }, []);

  const resetData = useCallback(() => {
    setData({
      categories: seedCategories,
      transactions: seedTransactions,
      cashSessions: seedCashSessions,
      business: { ...businessInfo },
      products: seedProducts,
      sales: [],
      purchases: [],
    });
  }, []);

  const openSession = useMemo(
    () => state.data.cashSessions.find((s) => s.status === "open") ?? null,
    [state.data.cashSessions],
  );

  const value = useMemo<AppStore>(
    () => ({
      hydrated: state.hydrated,
      isAuthenticated: state.isAuthenticated,
      business: state.data.business,
      categories: state.data.categories,
      transactions: state.data.transactions,
      cashSessions: state.data.cashSessions,
      products: state.data.products,
      sales: state.data.sales,
      purchases: state.data.purchases,
      openSession,
      login,
      logout,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      openCash,
      closeCash,
      updateBusiness,
      exportBackup,
      importBackup,
      resetData,
      addProduct,
      updateProduct,
      deleteProduct,
      createSale,
      deleteSale,
      createPurchase,
      deletePurchase,
    }),
    [
      state,
      openSession,
      login,
      logout,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      openCash,
      closeCash,
      updateBusiness,
      exportBackup,
      importBackup,
      resetData,
      addProduct,
      updateProduct,
      deleteProduct,
      createSale,
      deleteSale,
      createPurchase,
      deletePurchase,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
