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
  seedTransactions,
} from "@/lib/mock/data";
import type {
  BusinessInfo,
  CashSession,
  Category,
  Transaction,
  TransactionType,
} from "@/lib/types";
import { todayISO, uid } from "@/lib/utils/format";
import { AUTH_KEY, DATA_KEY, loadJSON, removeKey, saveJSON } from "./storage";

type AppData = {
  categories: Category[];
  transactions: Transaction[];
  cashSessions: CashSession[];
  business: BusinessInfo;
};

type TransactionInput = {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
};

type CategoryInput = {
  name: string;
  type: TransactionType;
};

type AppStore = {
  hydrated: boolean;
  isAuthenticated: boolean;
  business: BusinessInfo;
  categories: Category[];
  transactions: Transaction[];
  cashSessions: CashSession[];
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
};

const defaultData: AppData = {
  categories: seedCategories,
  transactions: seedTransactions,
  cashSessions: seedCashSessions,
  business: businessInfo,
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

function ensureClientInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const auth = loadJSON<{ loggedIn: boolean } | null>(AUTH_KEY, null);
  snapshot = {
    hydrated: true,
    isAuthenticated: Boolean(auth?.loggedIn),
    data: loadJSON<AppData>(DATA_KEY, defaultData),
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
        t.id === id ? { ...t, ...input } : t,
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
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

      const today = todayISO();
      const dayTx = prev.transactions.filter((t) => t.date === today);
      const income = dayTx
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = dayTx
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const closingBalance = open.openingBalance + income - expense;
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
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
