"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import type { SortOrder } from "@/types/api";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableBulkAction {
  id: string;
  label: string;
  onClick: (selectedIds: string[]) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
}

export interface DataTableProps<T extends { id: string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (columnId: string, order: SortOrder) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: DataTableBulkAction[];
  className?: string;
}

function SortIcon({ active, order }: { active: boolean; order?: SortOrder }) {
  if (!active) {
    return <ArrowUpDown className="text-brand-muted size-3.5" aria-hidden />;
  }
  if (order === "asc") {
    return <ArrowUp className="text-brand-green size-3.5" aria-hidden />;
  }
  return <ArrowDown className="text-brand-green size-3.5" aria-hidden />;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  error = null,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting filters or search.",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  selectedIds,
  onSelectionChange,
  bulkActions,
  className,
}: DataTableProps<T>) {
  const selectable = Boolean(onSelectionChange);
  const selected = selectedIds ?? [];
  const pageIds = data.map((row) => row.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const somePageSelected =
    pageIds.some((id) => selected.includes(id)) && !allPageSelected;

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allPageSelected) {
      onSelectionChange(selected.filter((id) => !pageIds.includes(id)));
    } else {
      const merged = new Set([...selected, ...pageIds]);
      onSelectionChange([...merged]);
    }
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((item) => item !== id));
    } else {
      onSelectionChange([...selected, id]);
    }
  };

  const handleSort = (columnId: string) => {
    if (!onSort) return;
    if (sortBy !== columnId) {
      onSort(columnId, "asc");
      return;
    }
    onSort(columnId, sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div
      className={cn(
        "border-brand-border bg-brand-surface overflow-hidden rounded-lg border",
        className,
      )}
    >
      {(onSearchChange || (bulkActions && selected.length > 0)) && (
        <div className="border-brand-border flex flex-wrap items-center gap-3 border-b px-4 py-3">
          {onSearchChange ? (
            <div className="relative min-w-[12rem] flex-1">
              <Search
                className="text-brand-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
                aria-label="Search table"
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {bulkActions && selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-brand-muted text-xs">
                {selected.length} selected
              </span>
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  size="sm"
                  variant={action.variant ?? "outline"}
                  onClick={() => action.onClick(selected)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead className="bg-brand-sand/80 text-brand-muted text-xs tracking-wide uppercase">
            <tr>
              {selectable ? (
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all rows on this page"
                    disabled={loading || data.length === 0}
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn("px-4 py-3 font-medium", column.className)}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      className="text-brand-muted hover:text-brand-ink inline-flex items-center gap-1.5"
                      onClick={() => handleSort(column.id)}
                    >
                      {column.header}
                      <SortIcon
                        active={sortBy === column.id}
                        order={sortBy === column.id ? sortOrder : undefined}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-16"
                >
                  <div className="text-brand-muted flex flex-col items-center gap-2">
                    <Spinner />
                    <span className="text-sm">Loading…</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4"
                >
                  <ErrorState title="Failed to load" description={error} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isSelected = selected.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-brand-border border-t",
                      isSelected && "bg-brand-green-muted/40",
                    )}
                  >
                    {selectable ? (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select row ${row.id}`}
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "text-brand-ink px-4 py-3",
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {onPageChange ? (
        <div className="border-brand-border text-brand-muted flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
          <span>
            {total === 0 ? "0 results" : `Showing ${from}–${to} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading || total === 0}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
