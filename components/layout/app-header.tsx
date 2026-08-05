"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

type AppHeaderProps = {
  onMenuClick: () => void;
};

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { business, openSession, logout } = useAppStore();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-cream/90 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="px-2 lg:hidden"
          onClick={onMenuClick}
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm font-semibold text-forest">{business.name}</p>
          <p className="text-xs text-muted">{business.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={openSession ? "open" : "closed"}>
          Kasa {openSession ? "Açık" : "Kapalı"}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          <span className="hidden sm:inline">Çıkış</span>
        </Button>
      </div>
    </header>
  );
}
