"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store/app-store";
import { useFeedback } from "@/lib/store/feedback-store";
import { Download, RotateCcw, Upload } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

function parseMoney(value: string) {
  return Number(value.replace(",", "."));
}

export default function SettingsPage() {
  const {
    business,
    updateBusiness,
    exportBackup,
    importBackup,
    resetData,
  } = useAppStore();
  const { notify } = useFeedback();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(business.name);
  const [email, setEmail] = useState(business.email);
  const [defaultOpening, setDefaultOpening] = useState(
    String(business.defaultOpeningBalance),
  );
  const [dailyTarget, setDailyTarget] = useState(
    String(business.dailyIncomeTarget),
  );
  const [weeklyTarget, setWeeklyTarget] = useState(
    String(business.weeklyIncomeTarget),
  );
  const [monthlyTarget, setMonthlyTarget] = useState(
    String(business.monthlyIncomeTarget),
  );
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setName(business.name);
    setEmail(business.email);
    setDefaultOpening(String(business.defaultOpeningBalance));
    setDailyTarget(String(business.dailyIncomeTarget));
    setWeeklyTarget(String(business.weeklyIncomeTarget));
    setMonthlyTarget(String(business.monthlyIncomeTarget));
  }, [business]);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const opening = parseMoney(defaultOpening);
    const daily = parseMoney(dailyTarget);
    const weekly = parseMoney(weeklyTarget);
    const monthly = parseMoney(monthlyTarget);

    if (!name.trim()) {
      notify({
        title: "İşletme adı gerekli",
        status: "error",
        variant: "toast",
      });
      return;
    }
    if (
      [opening, daily, weekly, monthly].some(
        (n) => Number.isNaN(n) || n < 0,
      )
    ) {
      notify({
        title: "Geçersiz tutar",
        description: "Tüm tutarlar 0 veya üzeri olmalı.",
        status: "error",
        variant: "toast",
      });
      return;
    }

    updateBusiness({
      name: name.trim(),
      email: email.trim(),
      defaultOpeningBalance: opening,
      dailyIncomeTarget: daily,
      weeklyIncomeTarget: weekly,
      monthlyIncomeTarget: monthly,
    });
    notify({
      title: "Ayarlar kaydedildi",
      status: "success",
      variant: "toast",
    });
  }

  function handleExport() {
    const json = exportBackup();
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kasa-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify({
      title: "Yedek indirildi",
      status: "success",
      variant: "toast",
    });
  }

  async function handleImport(file: File) {
    const text = await file.text();
    const result = importBackup(text);
    if (!result.ok) {
      notify({
        title: "İçe aktarma başarısız",
        description: result.error,
        status: "error",
        variant: "modal",
      });
      return;
    }
    notify({
      title: "Yedek yüklendi",
      description: "Veriler başarıyla içe aktarıldı.",
      status: "success",
      variant: "modal",
    });
  }

  return (
    <div>
      <PageHeader
        title="Ayarlar"
        description="İşletme, hedefler, yedekleme ve veri yönetimi"
      />

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>İşletme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="İşletme adı" htmlFor="biz-name">
                <Input
                  id="biz-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="E-posta" htmlFor="biz-email">
                <Input
                  id="biz-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>
              <FormField
                label="Varsayılan kasa açılış bakiyesi (₺)"
                htmlFor="biz-opening"
                hint="Kasa açılış formunda varsayılan olarak gelir"
              >
                <Input
                  id="biz-opening"
                  type="number"
                  min="0"
                  step="0.01"
                  value={defaultOpening}
                  onChange={(e) => setDefaultOpening(e.target.value)}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gelir hedefleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Günlük hedef (₺)"
                htmlFor="goal-daily"
                hint="Dashboard’da günlük ilerleme olarak görünür"
              >
                <Input
                  id="goal-daily"
                  type="number"
                  min="0"
                  step="100"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(e.target.value)}
                />
              </FormField>
              <FormField label="Haftalık hedef (₺)" htmlFor="goal-weekly">
                <Input
                  id="goal-weekly"
                  type="number"
                  min="0"
                  step="100"
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(e.target.value)}
                />
              </FormField>
              <FormField
                label="Aylık hedef (₺)"
                htmlFor="goal-monthly"
                hint="Tempo kontrolü ile ayın gününe göre takip edilir"
              >
                <Input
                  id="goal-monthly"
                  type="number"
                  min="0"
                  step="100"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                />
              </FormField>
            </CardContent>
          </Card>
        </div>

        <Button type="submit">Kaydet</Button>
      </form>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yedekleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted">
              Tüm işlem, kategori, hedef ve kasa verilerini JSON olarak indirin
              veya geri yükleyin.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleExport}
              >
                Yedek indir
              </Button>
              <Button
                type="button"
                variant="ghost"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => fileRef.current?.click()}
              >
                Yedek yükle
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImport(file);
                  e.target.value = "";
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veri sıfırlama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert variant="warning" title="Dikkat">
              Demo verilere dönülür; mevcut kayıtlar silinir. Önce yedek alın.
            </Alert>
            <Button
              type="button"
              variant="danger"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={() => setResetOpen(true)}
            >
              Demo verilere sıfırla
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Verileri sıfırla"
        description="Tüm yerel veriler silinip demo veriye dönülecek."
        confirmLabel="Sıfırla"
        danger
        onConfirm={() => {
          resetData();
          notify({
            title: "Veriler sıfırlandı",
            status: "success",
            variant: "toast",
          });
        }}
      />
    </div>
  );
}
