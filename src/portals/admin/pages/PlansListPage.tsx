"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { usePlans } from "@/features/plans/queries/usePlans";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader, StatusBadge } from "@/portals/admin/components/AdminUi";
import { DeletePlanButton } from "@/portals/admin/components/DeletePlanButton";
import { EditPlanControl } from "@/portals/admin/components/EditPlanControl";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Plan } from "@/types/entities";
import { PlanStatus } from "@/types/enums";
import type { SortOrder } from "@/types/api";

export function PlansListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const query = usePlans({
    page,
    pageSize: 10,
    search: search || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
  });

  const columns: DataTableColumn<Plan>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Plan",
        sortable: true,
        cell: (row) => (
          <div>
            <Link
              href={`/admin/plans/${row.id}`}
              className="text-brand-navy hover:text-brand-green font-medium"
            >
              {row.name}
            </Link>
            <p className="text-brand-muted text-xs">{row.slug}</p>
          </div>
        ),
      },
      {
        id: "price",
        header: "Price",
        sortable: true,
        cell: (row) => formatCurrency(row.price || 0, row.currency || "INR"),
      },
      {
        id: "duration",
        header: "Duration",
        cell: (row) =>
          `${row.duration || 0} ${(row.durationUnit || "DAYS").toLowerCase()}`,
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "updatedAt",
        header: "Updated",
        sortable: true,
        cell: (row) => formatDate(row.updatedAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <div className="flex gap-2">
            <Link
              href={`/admin/plans/${row.id}`}
              className="text-brand-green text-xs font-medium hover:underline"
            >
              View
            </Link>
            <EditPlanControl
              planId={row.id}
              status={row.status}
              appearance="link"
            />
            <DeletePlanButton
              planId={row.id}
              planName={row.name}
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
        title="Plans"
        description="Manage meal subscription plans and catalog status."
        actions={
          <Link href="/admin/plans/new">
            <Button size="sm">
              <Plus className="size-3.5" />
              Add plan
            </Button>
          </Link>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
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
          {Object.values(PlanStatus).map((item) => (
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
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search plans…"
        page={page}
        pageSize={10}
        total={query.data?.meta.total ?? 0}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(columnId, order) => {
          setSortBy(columnId);
          setSortOrder(order);
        }}
        emptyTitle="No plans found"
      />
    </div>
  );
}
