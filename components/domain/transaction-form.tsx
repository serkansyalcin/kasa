"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  Category,
  PaymentMethod,
  Transaction,
  TransactionType,
} from "@/lib/types";
import { paymentMethodLabels } from "@/lib/utils/labels";
import { todayISO } from "@/lib/utils/format";
import { useMemo, useState, type FormEvent } from "react";

export type TransactionFormValues = {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
};

type TransactionFormProps = {
  categories: Category[];
  initial?: Transaction | null;
  defaultType?: TransactionType;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
};

export function TransactionForm({
  categories,
  initial,
  defaultType = "income",
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(
    initial?.type ?? defaultType,
  );
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : "",
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initial?.paymentMethod ?? "cash",
  );
  const [error, setError] = useState("");

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const resolvedCategoryId =
    categoryId && filteredCategories.some((c) => c.id === categoryId)
      ? categoryId
      : (filteredCategories[0]?.id ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(amount.replace(",", "."));
    if (!parsed || parsed <= 0) {
      setError("Geçerli bir tutar girin.");
      return;
    }
    if (!resolvedCategoryId) {
      setError("Kategori seçin.");
      return;
    }
    onSubmit({
      type,
      amount: parsed,
      categoryId: resolvedCategoryId,
      description: description.trim() || "—",
      date,
      paymentMethod,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tür">
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value as TransactionType);
              setCategoryId("");
            }}
          >
            <option value="income">Gelir</option>
            <option value="expense">Gider</option>
          </Select>
        </FormField>

        <FormField label="Ödeme yöntemi" htmlFor="payment">
          <Select
            id="payment"
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as PaymentMethod)
            }
          >
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
              (key) => (
                <option key={key} value={key}>
                  {paymentMethodLabels[key]}
                </option>
              ),
            )}
          </Select>
        </FormField>
      </div>

      <FormField label="Tutar (₺)" htmlFor="amount" error={error}>
        <Input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Kategori" htmlFor="category">
        <Select
          id="category"
          value={resolvedCategoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Tarih" htmlFor="date">
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Açıklama" htmlFor="description">
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="İşlem notu..."
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit">{initial ? "Kaydet" : "Ekle"}</Button>
      </div>
    </form>
  );
}
