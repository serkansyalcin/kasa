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
  seedTableOrders,
  seedTables,
  seedTransactions,
} from "@/lib/mock/data";
import type {
  BusinessInfo,
  CashSession,
  Category,
  DiningTable,
  DocLine,
  PaymentMethod,
  Product,
  ProductKind,
  Purchase,
  Sale,
  TableOrder,
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
  tables: DiningTable[];
  tableOrders: TableOrder[];
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
  tableId?: string;
  tableName?: string;
};

type TableInput = {
  name: string;
  capacity: number;
  sortOrder: number;
  active?: boolean;
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
  tables: DiningTable[];
  tableOrders: TableOrder[];
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
  addTable: (input: TableInput) => void;
  updateTable: (id: string, input: TableInput) => void;
  deleteTable: (
    id: string,
  ) => { ok: true } | { ok: false; error: string };
  openTableOrder: (
    tableId: string,
    guestCount?: number,
  ) => { ok: true; order: TableOrder } | { ok: false; error: string };
  updateTableOrder: (
    orderId: string,
    patch: { lines?: DocLine[]; note?: string; guestCount?: number },
  ) => { ok: true } | { ok: false; error: string };
  payTableOrder: (
    orderId: string,
    input: { paymentMethod: PaymentMethod; note?: string },
  ) => { ok: true; sale: Sale } | { ok: false; error: string };
  cancelTableOrder: (
    orderId: string,
  ) => { ok: true } | { ok: false; error: string };
};

const defaultData: AppData = {
  categories: seedCategories,
  transactions: seedTransactions,
  cashSessions: seedCashSessions,
  business: businessInfo,
  products: seedProducts,
  sales: seedSales,
  purchases: seedPurchases,
  tables: seedTables,
  tableOrders: seedTableOrders,
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

function migrateData(raw: Partial<AppData> & { business?: BusinessInfo }): AppData {
  return {
    categories: migrateCategories(raw.categories ?? seedCategories),
    transactions: (raw.transactions ?? []).map((t) => ({
      ...t,
      paymentMethod: t.paymentMethod ?? "cash",
      source: t.source ?? "manual",
    })),
    cashSessions: raw.cashSessions ?? seedCashSessions,
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
    products: raw.products?.length ? raw.products : seedProducts,
    sales: raw.sales ?? [],
    purchases: raw.purchases ?? [],
    tables: raw.tables?.length ? raw.tables : seedTables,
    tableOrders: raw.tableOrders ?? [],
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
      const removedSale =
        tx?.source === "sale"
          ? prev.sales.find((s) => s.transactionId === id)
          : undefined;
      return {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        sales: removedSale
          ? prev.sales.filter((s) => s.id !== removedSale.id)
          : prev.sales,
        purchases:
          tx?.source === "purchase"
            ? prev.purchases.filter((p) => p.transactionId !== id)
            : prev.purchases,
        tableOrders: removedSale
          ? prev.tableOrders.map((o) =>
              o.saleId === removedSale.id
                ? {
                    ...o,
                    status: "cancelled" as const,
                    saleId: undefined,
                    closedAt: o.closedAt ?? new Date().toISOString(),
                  }
                : o,
            )
          : prev.tableOrders,
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
    const tablePrefix = input.tableName?.trim()
      ? `Satış · ${input.tableName.trim()}: `
      : "Satış: ";

    const tx: Transaction = {
      id: txId,
      type: "income",
      amount: total,
      categoryId: SALE_CATEGORY_ID,
      description: `${tablePrefix}${summary}${more}`,
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
      tableId: input.tableId,
      tableName: input.tableName?.trim() || undefined,
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
        tableOrders: prev.tableOrders.map((o) =>
          o.saleId === id
            ? {
                ...o,
                status: "cancelled" as const,
                saleId: undefined,
                closedAt: o.closedAt ?? new Date().toISOString(),
              }
            : o,
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

  const addTable = useCallback((input: TableInput) => {
    const table: DiningTable = {
      id: uid("tbl"),
      name: input.name.trim(),
      capacity: Math.max(1, Math.round(input.capacity)),
      sortOrder: input.sortOrder,
      active: input.active ?? true,
    };
    setData((prev) => ({
      ...prev,
      tables: [...prev.tables, table].sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }, []);

  const updateTable = useCallback((id: string, input: TableInput) => {
    setData((prev) => ({
      ...prev,
      tables: prev.tables
        .map((t) =>
          t.id === id
            ? {
                ...t,
                name: input.name.trim(),
                capacity: Math.max(1, Math.round(input.capacity)),
                sortOrder: input.sortOrder,
                active: input.active ?? t.active,
              }
            : t,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }, []);

  const deleteTable = useCallback((id: string) => {
    const hasOpen = snapshot.data.tableOrders.some(
      (o) => o.tableId === id && o.status === "open",
    );
    if (hasOpen) {
      return {
        ok: false as const,
        error: "Açık adisyonu olan masa silinemez.",
      };
    }
    setData((prev) => ({
      ...prev,
      tables: prev.tables.filter((t) => t.id !== id),
    }));
    return { ok: true as const };
  }, []);

  const openTableOrder = useCallback(
    (tableId: string, guestCount?: number) => {
      const table = snapshot.data.tables.find((t) => t.id === tableId);
      if (!table || !table.active) {
        return { ok: false as const, error: "Masa bulunamadı veya pasif." };
      }
      const existing = snapshot.data.tableOrders.find(
        (o) => o.tableId === tableId && o.status === "open",
      );
      if (existing) {
        return { ok: false as const, error: "Bu masada zaten açık adisyon var." };
      }

      const order: TableOrder = {
        id: uid("ord"),
        tableId,
        status: "open",
        lines: [],
        guestCount: guestCount && guestCount > 0 ? guestCount : undefined,
        openedAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        tableOrders: [order, ...prev.tableOrders],
      }));

      return { ok: true as const, order };
    },
    [],
  );

  const updateTableOrder = useCallback(
    (
      orderId: string,
      patch: { lines?: DocLine[]; note?: string; guestCount?: number },
    ) => {
      const order = snapshot.data.tableOrders.find((o) => o.id === orderId);
      if (!order || order.status !== "open") {
        return { ok: false as const, error: "Açık adisyon bulunamadı." };
      }

      setData((prev) => ({
        ...prev,
        tableOrders: prev.tableOrders.map((o) => {
          if (o.id !== orderId) return o;
          const next: TableOrder = { ...o };
          if (patch.lines) {
            next.lines = patch.lines
              .filter((l) => l.name.trim() && l.qty > 0 && l.unitPrice >= 0)
              .map((l) => ({
                id: l.id || uid("ln"),
                productId: l.productId,
                name: l.name.trim(),
                qty: l.qty,
                unitPrice: l.unitPrice,
              }));
          }
          if (patch.note !== undefined) {
            next.note = patch.note.trim() || undefined;
          }
          if (patch.guestCount !== undefined) {
            next.guestCount =
              patch.guestCount > 0 ? patch.guestCount : undefined;
          }
          return next;
        }),
      }));

      return { ok: true as const };
    },
    [],
  );

  const payTableOrder = useCallback(
    (
      orderId: string,
      input: { paymentMethod: PaymentMethod; note?: string },
    ) => {
      const order = snapshot.data.tableOrders.find((o) => o.id === orderId);
      if (!order || order.status !== "open") {
        return { ok: false as const, error: "Açık adisyon bulunamadı." };
      }
      if (order.lines.length === 0) {
        return { ok: false as const, error: "Adisyonda ürün yok." };
      }

      const table = snapshot.data.tables.find((t) => t.id === order.tableId);
      const lines = normalizeLines(order.lines);
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
      const tableName = table?.name ?? "Masa";
      const note = (input.note ?? order.note)?.trim() || undefined;

      const tx: Transaction = {
        id: txId,
        type: "income",
        amount: total,
        categoryId: SALE_CATEGORY_ID,
        description: `Satış · ${tableName}: ${summary}${more}`,
        date: todayISO(),
        createdAt: new Date().toISOString(),
        paymentMethod: input.paymentMethod,
        source: "sale",
        sourceId: saleId,
      };

      const sale: Sale = {
        id: saleId,
        date: todayISO(),
        paymentMethod: input.paymentMethod,
        note,
        lines,
        total,
        transactionId: txId,
        createdAt: new Date().toISOString(),
        tableId: order.tableId,
        tableName,
      };

      const closedAt = new Date().toISOString();

      setData((prev) => ({
        ...prev,
        sales: [sale, ...prev.sales],
        transactions: [tx, ...prev.transactions],
        tableOrders: prev.tableOrders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "paid" as const,
                lines,
                note,
                closedAt,
                saleId,
              }
            : o,
        ),
      }));

      return { ok: true as const, sale };
    },
    [],
  );

  const cancelTableOrder = useCallback((orderId: string) => {
    const order = snapshot.data.tableOrders.find((o) => o.id === orderId);
    if (!order || order.status !== "open") {
      return { ok: false as const, error: "Açık adisyon bulunamadı." };
    }

    setData((prev) => ({
      ...prev,
      tableOrders: prev.tableOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "cancelled" as const,
              closedAt: new Date().toISOString(),
            }
          : o,
      ),
    }));

    return { ok: true as const };
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
      tables: seedTables,
      tableOrders: [],
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
      tables: state.data.tables,
      tableOrders: state.data.tableOrders,
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
      addTable,
      updateTable,
      deleteTable,
      openTableOrder,
      updateTableOrder,
      payTableOrder,
      cancelTableOrder,
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
      addTable,
      updateTable,
      deleteTable,
      openTableOrder,
      updateTableOrder,
      payTableOrder,
      cancelTableOrder,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
