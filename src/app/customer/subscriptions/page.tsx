"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useSubscriptions } from "@/features/subscriptions/hooks/useSubscriptions";
import { usePlans } from "@/features/plans/hooks/usePlans";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { subscriptionBadgeVariant } from "@/lib/utils/statusBadges";
import { SubscriptionStatus } from "@/types/enums";

type FilterTab = "active" | "upcoming" | "past";

const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAUSED,
]);
const UPCOMING_STATUSES: ReadonlySet<string> = new Set([
  SubscriptionStatus.PENDING,
]);
const PAST_STATUSES: ReadonlySet<string> = new Set([
  SubscriptionStatus.COMPLETED,
  SubscriptionStatus.CANCELLED,
  SubscriptionStatus.EXPIRED,
]);

export default function CustomerSubscriptionsPage() {
  const [tab, setTab] = useState<FilterTab>("active");
  const subscriptionsQuery = useSubscriptions({ pageSize: 50 });
  const plansQuery = usePlans({ pageSize: 50 });

  const planNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const plan of plansQuery.data?.data ?? []) {
      map.set(plan.id, plan.name);
    }
    return map;
  }, [plansQuery.data]);

  const filtered = useMemo(() => {
    const items = subscriptionsQuery.data?.data ?? [];
    return items.filter((sub) => {
      if (tab === "active") return ACTIVE_STATUSES.has(sub.status);
      if (tab === "upcoming") return UPCOMING_STATUSES.has(sub.status);
      return PAST_STATUSES.has(sub.status);
    });
  }, [subscriptionsQuery.data, tab]);

  if (subscriptionsQuery.isLoading) {
    return <LoadingState title="Loading subscriptions" />;
  }

  if (subscriptionsQuery.isError) {
    return (
      <ErrorState
        action={
          <Button
            variant="outline"
            onClick={() => subscriptionsQuery.refetch()}
          >
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="animate-[fade-up_0.5s_ease-out]">
      <PageHeader
        title="My subscriptions"
        description="Active, upcoming, and past meal cycles."
        action={
          <Link
            href="/customer/plans"
            className="bg-brand-green hover:bg-brand-green-light inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white"
          >
            New subscription
          </Link>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as FilterTab)}
        items={[
          { id: "active", label: "Active" },
          { id: "upcoming", label: "Upcoming" },
          { id: "past", label: "Past" },
        ]}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title={
              tab === "active"
                ? "No active subscriptions"
                : tab === "upcoming"
                  ? "Nothing upcoming"
                  : "No past subscriptions"
            }
            description="Browse plans to start a new meal cycle."
            action={
              <Link
                href="/customer/plans"
                className="bg-brand-green hover:bg-brand-green-light inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white"
              >
                Browse plans
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/customer/subscriptions/${sub.id}`}
                  className="border-brand-border bg-brand-surface hover:border-brand-green/40 flex flex-col gap-3 rounded-xl border p-5 transition hover:shadow-[0_12px_40px_-28px_rgba(45,106,79,0.35)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-brand-navy text-lg font-semibold">
                        {planNameById.get(sub.planId) ?? "Meal plan"}
                      </h2>
                      <Badge variant={subscriptionBadgeVariant(sub.status)}>
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="text-brand-muted mt-1 text-sm">
                      {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
                    </p>
                  </div>
                  <p className="text-brand-ink text-lg font-semibold">
                    {formatCurrency(sub.finalAmount)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tabs>
    </div>
  );
}
