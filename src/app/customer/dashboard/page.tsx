"use client";

import Link from "next/link";
import { Bell, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import {
  useCustomer,
  useCustomerDashboard,
  useNotifications,
} from "@/features/dashboard/hooks/useCustomerDashboard";
import { usePlan } from "@/features/plans/hooks/usePlans";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { useAppSelector } from "@/store/hooks";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  formatFoodPreference,
  formatHealthGoal,
  formatMealTypes,
} from "@/lib/meals/labels";
import { subscriptionBadgeVariant } from "@/lib/utils/statusBadges";

export default function CustomerDashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dashboardQuery = useCustomerDashboard();
  const notificationsQuery = useNotifications({ pageSize: 5 });
  const customerQuery = useCustomer(user?.id);
  const activeSub = dashboardQuery.data?.data.activeSubscription ?? null;
  const planQuery = usePlan(activeSub?.planId);

  if (dashboardQuery.isLoading) {
    return <LoadingState title="Loading your dashboard" />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        description="We could not load your dashboard."
        action={
          <Button variant="outline" onClick={() => dashboardQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const metrics = dashboardQuery.data?.data;
  const notifications = notificationsQuery.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? "there"}`}
        description="Your meals, deliveries, and wellness routine — in one calm place."
      />

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <Card className="from-brand-navy via-brand-navy to-brand-navy-soft relative overflow-hidden border-0 bg-gradient-to-br text-white shadow-[0_28px_70px_-34px_rgba(11,31,58,0.75)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(64,145,108,0.35),transparent_45%)]" />
          <CardHeader className="relative">
            <p className="text-sm text-white/65">Active subscription</p>
            <CardTitle className="font-display text-2xl text-white sm:text-3xl">
              {activeSub
                ? (planQuery.data?.data.name ?? "Your plan")
                : "No active plan yet"}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-5">
            {activeSub ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={subscriptionBadgeVariant(activeSub.status)}>
                    {activeSub.status}
                  </Badge>
                  <span className="text-sm text-white/75">
                    {formatDate(activeSub.startDate)} →{" "}
                    {formatDate(activeSub.endDate)}
                  </span>
                </div>
                <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {formatCurrency(activeSub.finalAmount)}
                </p>
                <Link
                  href={`/customer/subscriptions/${activeSub.id}`}
                  className="text-brand-navy hover:bg-brand-sand inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold transition-colors"
                >
                  Manage subscription
                </Link>
              </>
            ) : (
              <>
                <p className="max-w-md text-white/80">
                  Browse nutritionist-designed plans and start your next cycle
                  whenever you are ready.
                </p>
                <Link
                  href="/customer/plans"
                  className="bg-brand-green hover:bg-brand-green-light inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white"
                >
                  Browse plans
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-brand-border/70 bg-brand-surface/90 shadow-[0_18px_50px_-36px_rgba(11,31,58,0.45)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1.5">
            {[
              {
                href: "/customer/menu",
                label: "Today’s menu",
                icon: UtensilsCrossed,
              },
              {
                href: "/customer/subscriptions",
                label: "My subscriptions",
                icon: ShoppingBag,
              },
              {
                href: "/customer/addresses",
                label: "Delivery addresses",
                icon: MapPin,
              },
              {
                href: "/customer/notifications",
                label: `Notifications${metrics?.notifications.unread ? ` (${metrics.notifications.unread})` : ""}`,
                icon: Bell,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-brand-ink hover:bg-brand-sand flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all hover:pl-4"
                >
                  <span className="bg-brand-green-muted text-brand-green flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-4" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="font-display text-xl">
              Diet & wellness
            </CardTitle>
            <Link
              href="/customer/profile"
              className="text-brand-green text-sm font-medium"
            >
              Update
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <WellnessItem
              label="Food preference"
              value={formatFoodPreference(
                customerQuery.data?.data.preferences?.foodPreference,
              )}
            />
            <WellnessItem
              label="Meals required"
              value={formatMealTypes(activeSub?.mealTypes)}
            />
            <WellnessItem
              label="Start date"
              value={
                activeSub?.startDate ? formatDate(activeSub.startDate) : "—"
              }
            />
            <WellnessItem
              label="Health goal"
              value={formatHealthGoal(
                customerQuery.data?.data.preferences?.healthGoal,
              )}
            />
            <WellnessItem
              label="Allergies / avoid"
              value={
                customerQuery.data?.data.preferences?.allergies?.join(", ") ||
                "None noted"
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-brand-navy text-xl font-semibold sm:text-2xl">
            Recent notifications
          </h2>
          <Link
            href="/customer/notifications"
            className="text-brand-green hover:text-brand-green-light text-sm font-medium"
          >
            View all
          </Link>
        </div>

        {notificationsQuery.isLoading ? (
          <LoadingState title="Loading notifications" className="py-10" />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="You are all caught up"
            description="New delivery and subscription updates will appear here."
            className="border-brand-border bg-brand-surface rounded-2xl border"
          />
        ) : (
          <ul className="divide-brand-border border-brand-border/70 bg-brand-surface/95 divide-y overflow-hidden rounded-2xl border shadow-[0_18px_50px_-36px_rgba(11,31,58,0.35)]">
            {notifications.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.link ?? "/customer/notifications"}
                  className="hover:bg-brand-sand/70 flex items-start justify-between gap-4 px-5 py-4 transition-colors"
                >
                  <div>
                    <p className="text-brand-ink font-medium">{item.title}</p>
                    <p className="text-brand-muted mt-1 text-sm">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead ? (
                    <span className="bg-brand-green mt-1 size-2 shrink-0 rounded-full" />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WellnessItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-brand-muted text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className="text-brand-navy mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
