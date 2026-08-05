"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store/app-store";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function LoginPage() {
  const { login, isAuthenticated, hydrated } = useAppStore();
  const router = useRouter();
  const [email, setEmail] = useState("demo@kasatakip.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [hydrated, isAuthenticated, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(email, password);
    if (!ok) {
      setError("E-posta gerekli.");
      return;
    }
    router.replace("/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(162,220,24,0.35), transparent), radial-gradient(ellipse 70% 50% at 80% 80%, rgba(139,188,21,0.25), transparent), linear-gradient(160deg, #FFF6E5 0%, #E8EBE3 100%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-5xl tracking-tight text-forest">
            Kasa
          </p>
          <p className="mt-2 text-sm text-muted">
            Bar, cafe ve küçük işletmeler için kasa takibi
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField label="E-posta" htmlFor="email" error={error}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Şifre" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormField>
              <Button type="submit" className="w-full" size="lg">
                Giriş yap
              </Button>
              <p className="text-center text-xs text-muted">
                Demo giriş — herhangi bir şifre ile devam edebilirsiniz.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
