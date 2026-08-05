"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/app-store";
import { Spinner } from "@/components/ui/spinner";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, isAuthenticated } = useAppStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
