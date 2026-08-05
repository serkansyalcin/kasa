"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ExportMenuProps = {
  disabled?: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
};

export function ExportMenu({
  disabled,
  onExportCsv,
  onExportPdf,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        leftIcon={<Download className="h-4 w-4" />}
        rightIcon={
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        }
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Dışa aktar
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-forest hover:bg-cream"
            onClick={() => {
              setOpen(false);
              onExportCsv();
            }}
          >
            <FileSpreadsheet className="h-4 w-4 text-olive" />
            CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-forest hover:bg-cream"
            onClick={() => {
              setOpen(false);
              onExportPdf();
            }}
          >
            <FileText className="h-4 w-4 text-olive" />
            PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}
