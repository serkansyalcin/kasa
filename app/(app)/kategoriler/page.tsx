"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { Category, TransactionType } from "@/lib/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

export default function CategoriesPage() {
  const {
    categories,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useAppStore();
  const { notify } = useFeedback();

  const [tab, setTab] = useState<"all" | TransactionType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("income");
  const [error, setError] = useState("");

  const filtered = useMemo(
    () =>
      categories.filter((c) => (tab === "all" ? true : c.type === tab)),
    [categories, tab],
  );

  const usedIds = useMemo(
    () => new Set(transactions.map((t) => t.categoryId)),
    [transactions],
  );

  const columns: Column<Category>[] = [
    {
      id: "name",
      header: "Ad",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: "type",
      header: "Tür",
      cell: (row) => (
        <Badge variant={row.type === "income" ? "income" : "expense"}>
          {row.type === "income" ? "Gelir" : "Gider"}
        </Badge>
      ),
    },
    {
      id: "usage",
      header: "Kullanım",
      cell: (row) =>
        usedIds.has(row.id) ? (
          <span className="text-muted">İşlemlerde kullanılıyor</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      mobileLabel: "İşlem",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            aria-label="Düzenle"
            onClick={() => {
              setEditing(row);
              setName(row.name);
              setType(row.type);
              setModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-danger hover:bg-danger-soft"
            aria-label="Sil"
            disabled={usedIds.has(row.id)}
            title={
              usedIds.has(row.id)
                ? "Kullanılan kategori silinemez"
                : "Sil"
            }
            onClick={() => setDeleting(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setName("");
    setType(tab === "expense" ? "expense" : "income");
    setError("");
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Kategori adı gerekli.");
      return;
    }
    if (editing) {
      updateCategory(editing.id, { name: name.trim(), type });
      notify({
        title: "Kategori güncellendi",
        status: "success",
        variant: "toast",
      });
    } else {
      addCategory({ name: name.trim(), type });
      notify({
        title: "Kategori eklendi",
        status: "success",
        variant: "toast",
      });
    }
    setModalOpen(false);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Kategoriler"
        description="Gelir ve gider kategorilerini yönetin"
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreate}
          >
            Kategori ekle
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs
          items={[
            { id: "all", label: "Tümü" },
            { id: "income", label: "Gelir" },
            { id: "expense", label: "Gider" },
          ]}
          value={tab}
          onChange={(id) => setTab(id as "all" | TransactionType)}
        />
      </div>

      <Card>
        <CardContent className="pt-2">
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.id}
            emptyTitle="Kategori yok"
            emptyDescription="Yeni bir kategori ekleyerek başlayın."
            emptyAction={
              <Button size="sm" onClick={openCreate}>
                Kategori ekle
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Kategoriyi düzenle" : "Yeni kategori"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Ad" htmlFor="cat-name" error={error}>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Tür" htmlFor="cat-type">
            <Select
              id="cat-type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              İptal
            </Button>
            <Button type="submit">{editing ? "Kaydet" : "Ekle"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Kategoriyi sil"
        description={`“${deleting?.name}” silinecek.`}
        confirmLabel="Sil"
        danger
        onConfirm={() => {
          if (!deleting) return;
          deleteCategory(deleting.id);
          notify({
            title: "Kategori silindi",
            description: `"${deleting.name}" kaldırıldı.`,
            status: "success",
            variant: "modal",
          });
        }}
      />
    </div>
  );
}
