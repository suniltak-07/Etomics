"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useOrders } from "@/features/dashboard/hooks/useCustomerDashboard";
import { usePlans } from "@/features/plans/hooks/usePlans";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { orderBadgeVariant } from "@/lib/utils/statusBadges";

export default function CustomerOrdersPage() {
  const ordersQuery = useOrders({ pageSize: 50 });
  const plansQuery = usePlans({ pageSize: 50 });

  const planNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const plan of plansQuery.data?.data ?? []) {
      map.set(plan.id, plan.name);
    }
    return map;
  }, [plansQuery.data]);

  if (ordersQuery.isLoading) {
    return <LoadingState title="Loading orders" />;
  }

  if (ordersQuery.isError) {
    return (
      <ErrorState
        action={
          <Button variant="outline" onClick={() => ordersQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const orders = ordersQuery.data?.data ?? [];

  return (
    <div className="animate-[fade-up_0.5s_ease-out]">
      <PageHeader
        title="Orders"
        description="Upcoming and past meal deliveries tied to your subscriptions."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders appear once you have an active subscription."
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="border-brand-border bg-brand-surface rounded-xl border p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-brand-navy text-lg font-semibold">
                      {planNameById.get(order.planId) ?? "Meal order"}
                    </h2>
                    <Badge variant={orderBadgeVariant(order.status)}>
                      {order.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-brand-muted mt-1 text-sm">
                    {order.scheduledDate
                      ? `Scheduled ${formatDate(order.scheduledDate)}`
                      : `Created ${formatDate(order.createdAt)}`}
                    {order.mealTypes?.length
                      ? ` · ${order.mealTypes.join(", ")}`
                      : ""}
                  </p>
                  {order.notes ? (
                    <p className="text-brand-muted mt-2 text-sm">
                      {order.notes}
                    </p>
                  ) : null}
                </div>
                <p className="text-brand-ink font-semibold">
                  {formatCurrency(order.amount, order.currency)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
