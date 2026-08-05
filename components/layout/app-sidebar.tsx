"use client";

import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  BarChart3,
  Settings,
  ShoppingBag,
  PackagePlus,
  Package,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/satis", label: "Satış", icon: ShoppingBag },
  { href: "/alis", label: "Alış", icon: PackagePlus },
  { href: "/urunler", label: "Ürünler", icon: Package },
  { href: "/islemler", label: "İşlemler", icon: ArrowLeftRight },
  { href: "/kasa", label: "Kasa", icon: Wallet },
  { href: "/kategoriler", label: "Kategoriler", icon: Tags },
  { href: "/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

type AppSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function AppSidebar({ open = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-forest/30 backdrop-blur-[1px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-forest text-cream transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div>
            <p className="font-display text-2xl tracking-tight text-lime">
              Kasa
            </p>
            <p className="mt-0.5 text-xs text-cream/70">Küçük işletme takibi</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-cream hover:bg-olive/40 lg:hidden"
            onClick={onClose}
            aria-label="Menüyü kapat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-apple text-forest"
                    : "text-cream/85 hover:bg-olive/50 hover:text-cream",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-cream/10 px-5 py-4 text-xs text-cream/55">
          MVP · Frontend
        </div>
      </aside>
    </>
  );
}
