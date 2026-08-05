"use client";

import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/ui/export-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  downloadCsv,
  downloadPdf,
  normalizeSearch,
  printTable,
} from "@/lib/utils/table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Printer,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "./empty-state";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  /** CSV / yazdırma için düz metin */
  exportValue?: (row: T) => string;
  /** Sıralama değeri; yoksa exportValue kullanılır */
  sortValue?: (row: T) => string | number;
  /** Varsayılan: başlığı olan ve excludeFromExport olmayan sütunlar */
  sortable?: boolean;
  excludeFromExport?: boolean;
  excludeFromSearch?: boolean;
};

export type DataTableToolbar = {
  search?: boolean;
  export?: boolean;
  print?: boolean;
  title?: string;
  searchPlaceholder?: string;
  filename?: string;
};

type SortDir = "asc" | "desc";

type SortState = {
  columnId: string;
  direction: SortDir;
} | null;

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
  toolbar?: boolean | DataTableToolbar;
  /** Arama için satır metni (yoksa exportValue alanları kullanılır) */
  getSearchText?: (row: T) => string;
};

function resolveToolbar(
  toolbar?: boolean | DataTableToolbar,
): Required<DataTableToolbar> | null {
  if (!toolbar) return null;
  const defaults: Required<DataTableToolbar> = {
    search: true,
    export: true,
    print: true,
    title: "Liste",
    searchPlaceholder: "Ara...",
    filename: "liste",
  };
  if (toolbar === true) return defaults;
  return { ...defaults, ...toolbar };
}

function isSortable<T>(col: Column<T>) {
  if (col.sortable != null) return col.sortable;
  return Boolean(col.header.trim()) && !col.excludeFromExport;
}

function getSortValue<T>(col: Column<T>, row: T): string | number {
  if (col.sortValue) return col.sortValue(row);
  return col.exportValue?.(row) ?? "";
}

function compareValues(a: string | number, b: string | number) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b), "tr", {
    numeric: true,
    sensitivity: "base",
  });
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = "Kayıt bulunamadı",
  emptyDescription,
  emptyAction,
  className,
  toolbar,
  getSearchText,
}: DataTableProps<T>) {
  const options = resolveToolbar(toolbar);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const exportColumns = useMemo(
    () =>
      columns.filter((c) => !c.excludeFromExport && c.header.trim() !== ""),
    [columns],
  );

  const filteredData = useMemo(() => {
    if (!options?.search || !query.trim()) return data;
    const q = normalizeSearch(query.trim());
    return data.filter((row) => {
      const text =
        getSearchText?.(row) ??
        columns
          .filter((c) => !c.excludeFromSearch)
          .map((c) => c.exportValue?.(row) ?? "")
          .join(" ");
      return normalizeSearch(text).includes(q);
    });
  }, [columns, data, getSearchText, options?.search, query]);

  const displayData = useMemo(() => {
    if (!sort) return filteredData;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col || !isSortable(col)) return filteredData;

    const sorted = [...filteredData].sort((ra, rb) => {
      const cmp = compareValues(getSortValue(col, ra), getSortValue(col, rb));
      return sort.direction === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [columns, filteredData, sort]);

  function toggleSort(columnId: string) {
    setSort((prev) => {
      if (!prev || prev.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { columnId, direction: "desc" };
      }
      return null;
    });
  }

  function buildExportRows(rows: T[]) {
    const headers = exportColumns.map((c) => c.header);
    const body = rows.map((row) =>
      exportColumns.map((c) => c.exportValue?.(row) ?? ""),
    );
    return { headers, body };
  }

  function handleExportCsv() {
    if (!options) return;
    const { headers, body } = buildExportRows(displayData);
    downloadCsv(options.filename, headers, body);
  }

  async function handleExportPdf() {
    if (!options) return;
    const { headers, body } = buildExportRows(displayData);
    try {
      await downloadPdf({
        filename: options.filename,
        title: options.title,
        headers,
        rows: body,
      });
    } catch (err) {
      console.error(err);
      alert("PDF oluşturulamadı. Sayfayı yenileyip tekrar deneyin.");
    }
  }

  function handlePrint() {
    if (!options) return;
    const { headers, body } = buildExportRows(displayData);
    printTable({ title: options.title, headers, rows: body });
  }

  const showToolbar = Boolean(options);
  const sortableColumns = columns.filter(isSortable);

  return (
    <div className={cn("w-full", className)}>
      {showToolbar && options ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {options.search ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={options.searchPlaceholder}
                className="pl-9 pr-9"
                aria-label="Tabloda ara"
              />
              {query ? (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1 text-muted hover:bg-muted-light hover:text-forest"
                  onClick={() => setQuery("")}
                  aria-label="Aramayı temizle"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {sortableColumns.length > 0 ? (
              <label className="flex items-center gap-1.5 text-xs text-muted md:hidden">
                <span className="shrink-0">Sıra</span>
                <select
                  className="h-8 rounded-lg border border-border bg-surface px-2 text-sm text-forest"
                  value={
                    sort
                      ? `${sort.columnId}:${sort.direction}`
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setSort(null);
                      return;
                    }
                    const [columnId, direction] = value.split(":") as [
                      string,
                      SortDir,
                    ];
                    setSort({ columnId, direction });
                  }}
                >
                  <option value="">Varsayılan</option>
                  {sortableColumns.flatMap((col) => [
                    <option key={`${col.id}-asc`} value={`${col.id}:asc`}>
                      {col.header} (A→Z)
                    </option>,
                    <option key={`${col.id}-desc`} value={`${col.id}:desc`}>
                      {col.header} (Z→A)
                    </option>,
                  ])}
                </select>
              </label>
            ) : null}
            <span className="mr-1 text-xs text-muted tabular-nums">
              {displayData.length} kayıt
            </span>
            {options.export ? (
              <ExportMenu
                disabled={displayData.length === 0}
                onExportCsv={handleExportCsv}
                onExportPdf={handleExportPdf}
              />
            ) : null}
            {options.print ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Printer className="h-4 w-4" />}
                onClick={handlePrint}
                disabled={displayData.length === 0}
              >
                Yazdır
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {displayData.length === 0 ? (
        <EmptyState
          title={query ? "Sonuç bulunamadı" : emptyTitle}
          description={
            query
              ? `"${query}" için eşleşen kayıt yok.`
              : emptyDescription
          }
          action={query ? undefined : emptyAction}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  {columns.map((col) => {
                    const sortable = isSortable(col);
                    const active = sort?.columnId === col.id;
                    const ariaSort = !sortable
                      ? undefined
                      : active
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none";

                    return (
                      <th
                        key={col.id}
                        aria-sort={ariaSort}
                        className={cn(
                          "px-4 py-3 font-medium whitespace-nowrap",
                          col.className,
                        )}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.id)}
                            className={cn(
                              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg transition-colors hover:text-forest",
                              active ? "text-forest" : "text-muted",
                            )}
                          >
                            {col.header}
                            {active && sort.direction === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : active && sort.direction === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                            )}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayData.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    className="border-b border-border/70 last:border-0 hover:bg-cream/60"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn("px-4 py-3 align-middle", col.className)}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {displayData.map((row) => (
              <div
                key={keyExtractor(row)}
                className="rounded-xl border border-border bg-cream/40 p-4"
              >
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((col) => (
                    <div
                      key={col.id}
                      className="flex items-start justify-between gap-3 py-1.5 text-sm"
                    >
                      <span className="text-muted">
                        {col.mobileLabel ?? col.header}
                      </span>
                      <div className="text-right font-medium text-forest">
                        {col.cell(row)}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
