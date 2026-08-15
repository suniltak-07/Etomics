"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  useCancelSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useSubscriptions,
} from "@/features/subscriptions/queries/useSubscriptions";
import { usePlans } from "@/features/plans/queries/usePlans";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader, StatusBadge } from "@/portals/admin/components/AdminUi";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { formatMealTypes } from "@/lib/meals/labels";
import type { Subscription } from "@/types/entities";
import { SubscriptionStatus } from "@/types/enums";

const EXPIRING_DAYS = 14;

export function SubscriptionsListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const filterFromUrl = searchParams.get("filter") ?? "";

  const [page, setPage] = useState(1);
  const [planId, setPlanId] = useState("");

  const updateStatusFilter = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");
    params.delete("filter");
    setPage(1);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const query = useSubscriptions({
    page: filterFromUrl === "expiring" ? 1 : page,
    pageSize: filterFromUrl === "expiring" ? 100 : 10,
    status: status || undefined,
  });
  const plans = usePlans({ pageSize: 100 });

  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const cancelMutation = useCancelSubscription();

  const planNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const plan of plans.data?.data ?? []) {
      map.set(plan.id, plan.name);
    }
    return map;
  }, [plans.data]);

  const rows = useMemo(() => {
    let items = query.data?.data ?? [];
    if (planId) {
      items = items.filter((item) => item.planId === planId);
    }
    if (filterFromUrl === "expiring") {
      const today = new Date();
      items = items.filter((item) => {
        if (item.status !== SubscriptionStatus.ACTIVE) return false;
        const end = parseISO(item.endDate);
        const days = differenceInCalendarDays(end, today);
        return days >= 0 && days <= EXPIRING_DAYS;
      });
    }
    return items;
  }, [query.data, planId, filterFromUrl]);

  const columns: DataTableColumn<Subscription>[] = useMemo(
    () => [
      {
        id: "id",
        header: "Subscription",
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
        id: "plan",
        header: "Plan",
        cell: (row) => (
          <Link href={`/admin/plans/${row.planId}`} className="hover:underline">
            {planNameById.get(row.planId) ?? row.planId}
          </Link>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "meals",
        header: "Meals",
        cell: (row) => formatMealTypes(row.mealTypes),
      },
      {
        id: "period",
        header: "Start → end",
        cell: (row) =>
          `${formatDate(row.startDate)} → ${formatDate(row.endDate)}`,
      },
      {
        id: "amount",
        header: "Amount",
        cell: (row) => formatCurrency(row.finalAmount),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.status === SubscriptionStatus.ACTIVE ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pauseMutation.isPending}
                onClick={() => pauseMutation.mutate(row.id)}
              >
                Pause
              </Button>
            ) : null}
            {row.status === SubscriptionStatus.PAUSED ? (
              <Button
                size="sm"
                variant="outline"
                disabled={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate(row.id)}
              >
                Resume
              </Button>
            ) : null}
            {row.status === SubscriptionStatus.ACTIVE ||
            row.status === SubscriptionStatus.PAUSED ||
            row.status === SubscriptionStatus.PENDING ? (
              <Button
                size="sm"
                variant="danger"
                disabled={cancelMutation.isPending}
                onClick={() => {
                  const reason = window.prompt(
                    "Cancellation reason (optional)",
                  );
                  if (reason === null) return;
                  cancelMutation.mutate({
                    id: row.id,
                    reason: reason || undefined,
                  });
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [planNameById, pauseMutation, resumeMutation, cancelMutation],
  );

  const title =
    filterFromUrl === "expiring"
      ? "Expiring subscriptions"
      : status === SubscriptionStatus.ACTIVE
        ? "Active subscriptions"
        : "Subscriptions";

  return (
    <div>
      <PageHeader
        title={title}
        description="Filter by status or plan. Pause, resume, or cancel as needed."
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <Select
          className="w-44"
          value={status}
          onChange={(event) => updateStatusFilter(event.target.value)}
          aria-label="Filter by status"
          disabled={filterFromUrl === "expiring"}
        >
          <option value="">All statuses</option>
          {Object.values(SubscriptionStatus).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          className="w-56"
          value={planId}
          onChange={(event) => {
            setPlanId(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by plan"
        >
          <option value="">All plans</option>
          {(plans.data?.data ?? []).map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : null}
        page={page}
        pageSize={10}
        total={
          filterFromUrl === "expiring" || planId
            ? rows.length
            : (query.data?.meta.total ?? 0)
        }
        onPageChange={
          filterFromUrl === "expiring" || planId ? undefined : setPage
        }
        emptyTitle="No subscriptions"
      />
    </div>
  );
}
