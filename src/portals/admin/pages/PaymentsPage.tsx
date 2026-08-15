"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePayments } from "@/features/payments/queries/usePayments";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Select } from "@/components/ui/select";
import { PageHeader, StatusBadge } from "@/portals/admin/components/AdminUi";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Payment } from "@/types/entities";
import { PaymentStatus } from "@/types/enums";

export function PaymentsListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const query = usePayments({
    page,
    pageSize: 10,
    status: status || undefined,
  });

  const columns: DataTableColumn<Payment>[] = useMemo(
    () => [
      {
        id: "id",
        header: "Payment",
        cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
      },
      {
        id: "customer",
        header: "Customer",
        cell: (row) => (
          <Link
            href={`/admin/customers/${row.customerId}`}
            className="text-brand-green hover:underline"
          >
            {row.customerId}
          </Link>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        cell: (row) => formatCurrency(row.amount, row.currency),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "provider",
        header: "Provider",
        cell: (row) => row.provider,
      },
      {
        id: "method",
        header: "Method",
        cell: (row) => row.method ?? "—",
      },
      {
        id: "createdAt",
        header: "Date",
        cell: (row) => formatDate(row.createdAt, "dd MMM yyyy HH:mm"),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Successful and failed payment attempts."
      />
      <div className="mb-3">
        <Select
          className="w-44"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {Object.values(PaymentStatus).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : null}
        page={page}
        pageSize={10}
        total={query.data?.meta.total ?? 0}
        onPageChange={setPage}
        emptyTitle="No payments"
      />
    </div>
  );
}
