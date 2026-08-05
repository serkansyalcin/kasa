"use client";

import { CashSessionCard } from "@/components/domain/cash-session-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import type { CashSession } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { expectedCashBalance } from "@/lib/utils/stats";
import { useMemo, useState, type FormEvent } from "react";

export default function CashPage() {
  const {
    openSession,
    cashSessions,
    transactions,
    openCash,
    closeCash,
  } = useAppStore();
  const { notify } = useFeedback();

  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("1500");
  const [openNote, setOpenNote] = useState("");
  const [counted, setCounted] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [error, setError] = useState("");

  const expected = expectedCashBalance(openSession, transactions);

  const history = useMemo(
    () =>
      cashSessions
        .filter((s) => s.status === "closed")
        .sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? "")),
    [cashSessions],
  );

  const columns: Column<CashSession>[] = [
    {
      id: "opened",
      header: "Açılış",
      cell: (row) => formatDateTime(row.openedAt),
    },
    {
      id: "closed",
      header: "Kapanış",
      cell: (row) =>
        row.closedAt ? formatDateTime(row.closedAt) : "—",
    },
    {
      id: "opening",
      header: "Açılış",
      cell: (row) => (
        <span className="tabular-nums">{formatMoney(row.openingBalance)}</span>
      ),
    },
    {
      id: "closing",
      header: "Beklenen",
      cell: (row) => (
        <span className="tabular-nums">
          {row.closingBalance != null ? formatMoney(row.closingBalance) : "—"}
        </span>
      ),
    },
    {
      id: "counted",
      header: "Sayım",
      cell: (row) => (
        <span className="tabular-nums">
          {row.countedBalance != null ? formatMoney(row.countedBalance) : "—"}
        </span>
      ),
    },
    {
      id: "diff",
      header: "Fark",
      cell: (row) => {
        if (row.difference == null) return "—";
        const positive = row.difference >= 0;
        return (
          <Badge variant={row.difference === 0 ? "success" : "neutral"}>
            <span className="tabular-nums">
              {positive ? "+" : ""}
              {formatMoney(row.difference)}
            </span>
          </Badge>
        );
      },
    },
  ];

  function handleOpen(e: FormEvent) {
    e.preventDefault();
    const value = Number(openingBalance.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      setError("Geçerli bir açılış bakiyesi girin.");
      return;
    }
    openCash(value, openNote.trim() || undefined);
    notify({
      title: "Kasa açıldı",
      description: "Günlük oturum başlatıldı.",
      status: "success",
      variant: "toast",
    });
    setOpenModal(false);
    setError("");
    setOpenNote("");
  }

  function handleClose(e: FormEvent) {
    e.preventDefault();
    const value = Number(counted.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      setError("Geçerli bir sayım tutarı girin.");
      return;
    }
    closeCash(value, closeNote.trim() || undefined);
    notify({
      title: "Kasa kapatıldı",
      description: "Oturum başarıyla sonlandırıldı.",
      status: "success",
      variant: "modal",
    });
    setCloseModal(false);
    setError("");
    setCounted("");
    setCloseNote("");
  }

  return (
    <div>
      <PageHeader
        title="Kasa"
        description="Günlük kasa açılış ve kapanış işlemleri"
        actions={
          openSession ? (
            <Button onClick={() => setCloseModal(true)}>Kasayı kapat</Button>
          ) : (
            <Button onClick={() => setOpenModal(true)}>Kasayı aç</Button>
          )
        }
      />

      {openSession ? (
        <div className="space-y-4">
          <CashSessionCard
            session={openSession}
            expectedBalance={expected}
          />
          <Alert variant="info" title="Kapanış ipucu">
            Sayım tutarını girerken beklenen bakiyeyi referans alın. Fark otomatik
            hesaplanır.
          </Alert>
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-semibold text-forest">Kasa kapalı</p>
            <p className="mt-1 text-sm text-muted">
              Güne başlamak için açılış bakiyesi ile kasayı açın.
            </p>
            <Button className="mt-4" onClick={() => setOpenModal(true)}>
              Kasayı aç
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Geçmiş oturumlar</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable
            columns={columns}
            data={history}
            keyExtractor={(r) => r.id}
            emptyTitle="Henüz kapanmış oturum yok"
            emptyDescription="İlk kasa kapanışınız burada listelenir."
          />
        </CardContent>
      </Card>

      <Modal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setError("");
        }}
        title="Kasayı aç"
        description="Günün başlangıç nakit bakiyesini girin."
      >
        <form onSubmit={handleOpen} className="space-y-4">
          <FormField
            label="Açılış bakiyesi (₺)"
            htmlFor="opening"
            error={error}
          >
            <Input
              id="opening"
              type="number"
              min="0"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Not" htmlFor="open-note">
            <Textarea
              id="open-note"
              value={openNote}
              onChange={(e) => setOpenNote(e.target.value)}
              placeholder="Opsiyonel"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpenModal(false)}
            >
              İptal
            </Button>
            <Button type="submit">Aç</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={closeModal}
        onClose={() => {
          setCloseModal(false);
          setError("");
        }}
        title="Kasayı kapat"
        description={
          expected != null
            ? `Beklenen bakiye: ${formatMoney(expected)}`
            : undefined
        }
      >
        <form onSubmit={handleClose} className="space-y-4">
          <FormField label="Sayım tutarı (₺)" htmlFor="counted" error={error}>
            <Input
              id="counted"
              type="number"
              min="0"
              step="0.01"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Not" htmlFor="close-note">
            <Textarea
              id="close-note"
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              placeholder="Fark açıklaması vb."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCloseModal(false)}
            >
              İptal
            </Button>
            <Button type="submit">Kapat</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
