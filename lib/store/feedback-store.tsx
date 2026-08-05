"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { uid } from "@/lib/utils/format";

export type FeedbackStatus = "success" | "error" | "info" | "warning";
export type FeedbackVariant = "toast" | "modal";

export type FeedbackInput = {
  title: string;
  description?: string;
  status?: FeedbackStatus;
  variant?: FeedbackVariant;
  /** Toast için ms; modal için yok sayılır. 0 = otomatik kapanmaz */
  duration?: number;
};

export type FeedbackItem = Required<Pick<FeedbackInput, "title">> & {
  id: string;
  description?: string;
  status: FeedbackStatus;
  variant: FeedbackVariant;
  duration: number;
};

type FeedbackStore = {
  items: FeedbackItem[];
  notify: (input: FeedbackInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const FeedbackContext = createContext<FeedbackStore | null>(null);

const DEFAULT_DURATION = 3500;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (input: FeedbackInput) => {
      const id = uid("fb");
      const variant = input.variant ?? "toast";
      const item: FeedbackItem = {
        id,
        title: input.title,
        description: input.description,
        status: input.status ?? "info",
        variant,
        duration:
          input.duration ?? (variant === "toast" ? DEFAULT_DURATION : 0),
      };

      setItems((prev) => {
        // Modal tek olsun; toast'lar üst üste binebilir (max 4)
        if (variant === "modal") {
          return [...prev.filter((p) => p.variant !== "modal"), item];
        }
        return [...prev.filter((p) => p.variant === "modal"), item].slice(-5);
      });

      if (item.duration > 0) {
        window.setTimeout(() => dismiss(id), item.duration);
      }

      return id;
    },
    [dismiss],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, notify, dismiss, clear }),
    [items, notify, dismiss, clear],
  );

  return (
    <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within FeedbackProvider");
  return ctx;
}
