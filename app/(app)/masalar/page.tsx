"use client";

import {
  TableFloor,
  type FloorTableView,
} from "@/components/domain/table-floor";
import { TableOrderPanel } from "@/components/domain/table-order-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { DiningTable, DocLine, PaymentMethod } from "@/lib/types";
import { docTotal } from "@/lib/types";
import { formatMoney } from "@/lib/utils/format";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

export default function TablesPage() {
  const {
    tables,
    tableOrders,
    products,
    openSession,
    addTable,
    updateTable,
    deleteTable,
    openTableOrder,
    updateTableOrder,
    payTableOrder,
    cancelTableOrder,
  } = useAppStore();
  const { notify } = useFeedback();

  const [tab, setTab] = useState("floor");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [openPrompt, setOpenPrompt] = useState<DiningTable | null>(null);
  const [guestCount, setGuestCount] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DiningTable | null>(null);
  const [deleting, setDeleting] = useState<DiningTable | null>(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [sortOrder, setSortOrder] = useState("1");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  const openOrdersByTable = useMemo(() => {
    const map = new Map<string, (typeof tableOrders)[number]>();
    for (const o of tableOrders) {
      if (o.status === "open") map.set(o.tableId, o);
    }
    return map;
  }, [tableOrders]);

  const floorItems: FloorTableView[] = useMemo(
    () =>
      [...tables]
        .filter((t) => t.active)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((table) => ({
          table,
          order: openOrdersByTable.get(table.id) ?? null,
        })),
    [tables, openOrdersByTable],
  );

  const openSummary = useMemo(() => {
    const open = tableOrders.filter((o) => o.status === "open");
    return {
      count: open.length,
      total: open.reduce((s, o) => s + docTotal(o.lines), 0),
    };
  }, [tableOrders]);

  const selectedOrder = useMemo(
    () => tableOrders.find((o) => o.id === selectedOrderId && o.status === "open"),
    [tableOrders, selectedOrderId],
  );
  const selectedTable = useMemo(
    () =>
      selectedOrder
        ? tables.find((t) => t.id === selectedOrder.tableId)
        : undefined,
    [selectedOrder, tables],
  );

  const definitionRows = useMemo(
    () => [...tables].sort((a, b) => a.sortOrder - b.sortOrder),
    [tables],
  );

  const columns: Column<DiningTable>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Masa",
        cell: (row) => (
          <div>
            <span className="font-medium text-forest">{row.name}</span>
            {!row.active ? (
              <Badge variant="closed" className="ml-2">
                Pasif
              </Badge>
            ) : null}
          </div>
        ),
        exportValue: (row) => row.name,
        sortValue: (row) => row.name,
      },
      {
        id: "capacity",
        header: "Kapasite",
        cell: (row) => `${row.capacity} kişi`,
        exportValue: (row) => String(row.capacity),
        sortValue: (row) => row.capacity,
      },
      {
        id: "sort",
        header: "Sıra",
        cell: (row) => row.sortOrder,
        exportValue: (row) => String(row.sortOrder),
        sortValue: (row) => row.sortOrder,
      },
      {
        id: "status",
        header: "Durum",
        cell: (row) => {
          const busy = openOrdersByTable.has(row.id);
          return (
            <Badge variant={busy ? "open" : row.active ? "closed" : "neutral"}>
              {busy ? "Dolu" : row.active ? "Boş" : "Pasif"}
            </Badge>
          );
        },
        exportValue: (row) =>
          openOrdersByTable.has(row.id)
            ? "Dolu"
            : row.active
              ? "Boş"
              : "Pasif",
      },
      {
        id: "actions",
        header: "",
        excludeFromExport: true,
        excludeFromSearch: true,
        className: "text-right",
        mobileLabel: "İşlem",
        cell: (row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => openEdit(row)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-danger"
              onClick={() => setDeleting(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [openOrdersByTable],
  );

  function openCreate() {
    const nextOrder =
      tables.reduce((max, t) => Math.max(max, t.sortOrder), 0) + 1;
    setEditing(null);
    setName(`Masa ${nextOrder}`);
    setCapacity("4");
    setSortOrder(String(nextOrder));
    setActive(true);
    setError("");
    setModalOpen(true);
  }

  function openEdit(table: DiningTable) {
    setEditing(table);
    setName(table.name);
    setCapacity(String(table.capacity));
    setSortOrder(String(table.sortOrder));
    setActive(table.active);
    setError("");
    setModalOpen(true);
  }

  function handleTableSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Masa adı gerekli.");
      return;
    }
    const cap = Number(capacity);
    const order = Number(sortOrder);
    if (!Number.isFinite(cap) || cap < 1) {
      setError("Kapasite geçersiz.");
      return;
    }
    if (!Number.isFinite(order)) {
      setError("Sıra geçersiz.");
      return;
    }

    const payload = {
      name: name.trim(),
      capacity: cap,
      sortOrder: order,
      active,
    };

    if (editing) {
      updateTable(editing.id, payload);
      notify({ title: "Masa güncellendi", status: "success", variant: "toast" });
    } else {
      addTable(payload);
      notify({ title: "Masa eklendi", status: "success", variant: "toast" });
    }
    setModalOpen(false);
  }

  function handleFloorSelect(item: FloorTableView) {
    if (item.order) {
      setSelectedOrderId(item.order.id);
      return;
    }
    setOpenPrompt(item.table);
    setGuestCount("");
  }

  function confirmOpenOrder() {
    if (!openPrompt) return;
    const guests = Number(guestCount);
    const result = openTableOrder(
      openPrompt.id,
      Number.isFinite(guests) && guests > 0 ? guests : undefined,
    );
    if (!result.ok) {
      notify({
        title: "Adisyon açılamadı",
        description: result.error,
        status: "error",
        variant: "toast",
      });
      return;
    }
    setOpenPrompt(null);
    setSelectedOrderId(result.order.id);
  }

  function persistLines(lines: DocLine[]) {
    if (!selectedOrder) return;
    updateTableOrder(selectedOrder.id, { lines });
  }

  function handlePay(paymentMethod: PaymentMethod, note?: string) {
    if (!selectedOrder) return;
    const result = payTableOrder(selectedOrder.id, { paymentMethod, note });
    if (!result.ok) {
      notify({
        title: "Ödeme alınamadı",
        description: result.error,
        status: "error",
        variant: "toast",
      });
      return;
    }
    notify({
      title: "Ödeme alındı",
      description: `${selectedTable?.name ?? "Masa"} · ${formatMoney(result.sale.total)}`,
      status: "success",
      variant: "toast",
    });
    setSelectedOrderId(null);
  }

  function handleCancelOrder() {
    if (!selectedOrder) return;
    if (selectedOrder.lines.length > 0) {
      setCancelConfirm(true);
      return;
    }
    const result = cancelTableOrder(selectedOrder.id);
    if (!result.ok) {
      notify({
        title: "İptal edilemedi",
        description: result.error,
        status: "error",
        variant: "toast",
      });
      return;
    }
    setSelectedOrderId(null);
    notify({ title: "Adisyon iptal edildi", status: "success", variant: "toast" });
  }

  return (
    <div>
      <PageHeader
        title="Masalar"
        description="Kat planı, açık adisyon ve masa tanımları"
        actions={
          <Link
            href="/urunler"
            className="inline-flex h-8 items-center rounded-xl border border-border bg-surface px-3 text-sm font-medium text-olive hover:border-apple hover:text-forest"
          >
            Ürünler
          </Link>
        }
      />

      {!openSession ? (
        <Alert variant="warning" title="Kasa kapalı" className="mb-4">
          Adisyon açıp ödeme alabilirsiniz; nakit sayımı için kasayı açmanız
          önerilir.{" "}
          <Link href="/kasa" className="font-medium underline">
            Kasaya git
          </Link>
        </Alert>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: "floor", label: "Kat planı" },
            { id: "defs", label: "Masa tanımları" },
          ]}
        />
        {openSummary.count > 0 ? (
          <p className="text-sm text-muted">
            <span className="font-medium text-forest">
              {openSummary.count} açık masa
            </span>
            {" · "}
            {formatMoney(openSummary.total)}
          </p>
        ) : null}
      </div>

      {tab === "floor" ? (
        <Card>
          <CardHeader>
            <CardTitle>Kat planı</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <TableFloor items={floorItems} onSelect={handleFloorSelect} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Masa tanımları</CardTitle>
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Masa ekle
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            <DataTable
              columns={columns}
              data={definitionRows}
              keyExtractor={(r) => r.id}
              toolbar={{
                title: "Masalar",
                filename: "masalar",
                searchPlaceholder: "Masa ara...",
              }}
              emptyTitle="Masa yok"
              emptyDescription="Kat planı için masa ekleyin."
              emptyAction={
                <Button size="sm" onClick={openCreate}>
                  Masa ekle
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      <Modal
        open={Boolean(openPrompt)}
        onClose={() => setOpenPrompt(null)}
        title={openPrompt ? `${openPrompt.name} — adisyon aç` : "Adisyon aç"}
      >
        <div className="space-y-4">
          <FormField label="Kişi sayısı (opsiyonel)" htmlFor="open-guests">
            <Input
              id="open-guests"
              type="number"
              min="1"
              max="30"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              placeholder={
                openPrompt ? String(openPrompt.capacity) : undefined
              }
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpenPrompt(null)}>
              İptal
            </Button>
            <Button onClick={confirmOpenOrder}>Adisyonu aç</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedOrder && selectedTable)}
        onClose={() => setSelectedOrderId(null)}
        title={selectedTable ? selectedTable.name : "Adisyon"}
        size="lg"
        className="max-w-4xl"
      >
        {selectedOrder && selectedTable ? (
          <TableOrderPanel
            table={selectedTable}
            order={selectedOrder}
            products={products}
            onChangeLines={persistLines}
            onChangeNote={(note) =>
              updateTableOrder(selectedOrder.id, { note })
            }
            onChangeGuests={(guestCount) =>
              updateTableOrder(selectedOrder.id, { guestCount })
            }
            onPay={handlePay}
            onCancel={handleCancelOrder}
          />
        ) : null}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Masayı düzenle" : "Yeni masa"}
      >
        <form onSubmit={handleTableSubmit} className="space-y-4">
          <FormField label="Ad" htmlFor="tbl-name" error={error}>
            <Input
              id="tbl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Masa 5"
              required
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Kapasite" htmlFor="tbl-cap">
              <Input
                id="tbl-cap"
                type="number"
                min="1"
                max="30"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </FormField>
            <FormField label="Sıra" htmlFor="tbl-sort">
              <Input
                id="tbl-sort"
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Durum" htmlFor="tbl-active">
            <Select
              id="tbl-active"
              value={active ? "active" : "inactive"}
              onChange={(e) => setActive(e.target.value === "active")}
            >
              <option value="active">Aktif — kat planında görünür</option>
              <option value="inactive">Pasif — gizlenir</option>
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
        title="Masayı sil"
        description={`“${deleting?.name}” silinecek.`}
        confirmLabel="Sil"
        danger
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteTable(deleting.id);
          if (!result.ok) {
            notify({
              title: "Silinemedi",
              description: result.error,
              status: "error",
              variant: "toast",
            });
            return;
          }
          notify({ title: "Masa silindi", status: "success", variant: "toast" });
        }}
      />

      <ConfirmDialog
        open={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        title="Adisyonu iptal et"
        description="Adisyondaki ürünler silinecek; kasa işlemi oluşmaz."
        confirmLabel="İptal et"
        danger
        onConfirm={() => {
          if (!selectedOrder) return;
          const result = cancelTableOrder(selectedOrder.id);
          setCancelConfirm(false);
          if (!result.ok) {
            notify({
              title: "İptal edilemedi",
              description: result.error,
              status: "error",
              variant: "toast",
            });
            return;
          }
          setSelectedOrderId(null);
          notify({
            title: "Adisyon iptal edildi",
            status: "success",
            variant: "toast",
          });
        }}
      />
    </div>
  );
}
