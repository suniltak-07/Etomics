"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  useVoucher,
  useVouchers,
} from "@/features/vouchers/queries/useVouchers";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { PageHeader, StatusBadge } from "@/portals/admin/components/AdminUi";
import { DeleteVoucherButton } from "@/portals/admin/components/DeleteVoucherButton";
import { VoucherForm } from "@/portals/admin/forms/VoucherForm";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Voucher } from "@/types/entities";
import { DiscountType } from "@/types/enums";

export function VouchersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const query = useVouchers({
    page,
    pageSize: 10,
    search: search || undefined,
  });

  const columns: DataTableColumn<Voucher>[] = useMemo(
    () => [
      {
        id: "code",
        header: "Code",
        cell: (row) => (
          <span className="font-mono text-sm font-medium">{row.code}</span>
        ),
      },
      { id: "name", header: "Name", cell: (row) => row.name },
      {
        id: "discount",
        header: "Discount",
        cell: (row) =>
          row.discountType === DiscountType.PERCENTAGE
            ? `${row.discountValue}%`
            : formatCurrency(row.discountValue),
      },
      {
        id: "usage",
        header: "Usage",
        cell: (row) =>
          `${row.usedCount}${row.usageLimit ? ` / ${row.usageLimit}` : ""}`,
      },
      {
        id: "expiry",
        header: "Expires",
        cell: (row) => formatDate(row.expiryDate),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <div className="flex gap-2">
            <Link
              href={`/admin/vouchers/${row.id}/edit`}
              className="text-brand-green text-xs font-medium hover:underline"
            >
              Edit
            </Link>
            <DeleteVoucherButton
              voucherId={row.id}
              voucherCode={row.code}
              appearance="link"
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Vouchers"
        description="Promo codes and discount campaigns."
        actions={
          <Link href="/admin/vouchers/new">
            <Button size="sm">
              <Plus className="size-3.5" />
              Add voucher
            </Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : null}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search vouchers…"
        page={page}
        pageSize={10}
        total={query.data?.meta.total ?? 0}
        onPageChange={setPage}
        emptyTitle="No vouchers"
      />
    </div>
  );
}

export function VoucherCreatePage() {
  return (
    <div>
      <PageHeader
        title="Add voucher"
        description="Configure discount type, limits, and plan applicability."
      />
      <VoucherForm />
    </div>
  );
}

export function VoucherEditPage({ id }: { id: string }) {
  const query = useVoucher(id);

  if (query.isLoading) return <LoadingState title="Loading voucher" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Voucher not found"
        description={
          query.error instanceof Error ? query.error.message : undefined
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit · ${query.data.code}`}
        description={query.data.name}
        actions={
          <DeleteVoucherButton
            voucherId={id}
            voucherCode={query.data.code}
            redirectTo="/admin/vouchers"
          />
        }
      />
      <VoucherForm voucherId={id} initialVoucher={query.data} />
    </div>
  );
}
