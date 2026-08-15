"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminDashboard } from "@/features/dashboard/queries/useAdminDashboard";
import { useCustomers } from "@/features/customers/queries/useCustomers";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import {
  MetricCard,
  PageHeader,
  StatusBadge,
} from "@/portals/admin/components/AdminUi";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PublicCustomer } from "@/features/customers/services/customerService";
import type { Subscription } from "@/types/entities";

export function DashboardPage() {
  const dashboard = useAdminDashboard();
  const customers = useCustomers({ page: 1, pageSize: 5 });

  if (dashboard.isLoading) {
    return <LoadingState title="Loading dashboard" />;
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description={
          dashboard.error instanceof Error
            ? dashboard.error.message
            : "Could not load admin metrics."
        }
      />
    );
  }

  const data = dashboard.data;

  const revenueChart = data.planPopularity.map((item) => ({
    name: item.name.length > 14 ? `${item.name.slice(0, 14)}…` : item.name,
    subscribers: item.subscribers,
    active: item.activeSubscribers,
  }));

  const subscriptionChart = [
    { name: "Active", value: data.subscriptions.active },
    { name: "Paused", value: data.subscriptions.paused },
    { name: "Pending", value: data.subscriptions.pending },
    { name: "Cancelled", value: data.subscriptions.cancelled },
  ];

  const customerColumns: DataTableColumn<PublicCustomer>[] = [
    {
      id: "name",
      header: "Customer",
      cell: (row) => (
        <Link
          href={`/admin/customers/${row.id}`}
          className="text-brand-green font-medium hover:underline"
        >
          {row.firstName} {row.lastName}
        </Link>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (row) => row.email,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
  ];

  const subscriptionColumns: DataTableColumn<Subscription>[] = [
    {
      id: "id",
      header: "Subscription",
      cell: (row) => (
        <span className="font-mono text-xs">{row.id.slice(0, 12)}…</span>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      cell: (row) => (
        <Link
          href={`/admin/plans/${row.planId}`}
          className="text-brand-green hover:underline"
        >
          {row.planId}
        </Link>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "end",
      header: "Ends",
      cell: (row) => formatDate(row.endDate),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Operational snapshot across customers, plans, and revenue."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={formatCurrency(data.payments.revenue, data.payments.currency)}
          hint={`${data.payments.successful} successful payments`}
        />
        <MetricCard
          label="Customers"
          value={data.customers.total}
          hint={`${data.customers.active} active`}
        />
        <MetricCard
          label="Active subscriptions"
          value={data.subscriptions.active}
          hint={`${data.subscriptions.total} total`}
        />
        <MetricCard
          label="Active plans"
          value={data.plans.active}
          hint={`${data.vouchers.active} active vouchers`}
        />
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-2">
        <div className="border-brand-border bg-brand-surface rounded-lg border p-4">
          <h2 className="text-brand-navy mb-3 text-sm font-semibold">
            Plan popularity
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dcd8" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="subscribers" fill="#0b1f3a" name="Subscribers" />
                <Bar dataKey="active" fill="#2d6a4f" name="Active" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border-brand-border bg-brand-surface rounded-lg border p-4">
          <h2 className="text-brand-navy mb-3 text-sm font-semibold">
            Subscriptions by status
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriptionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dcd8" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#40916c" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <h2 className="text-brand-navy mb-2 text-sm font-semibold">
            Recent customers
          </h2>
          <DataTable
            columns={customerColumns}
            data={customers.data?.data ?? []}
            loading={customers.isLoading}
            error={
              customers.error instanceof Error ? customers.error.message : null
            }
            emptyTitle="No customers"
            total={customers.data?.meta.total ?? 0}
            page={1}
            pageSize={5}
          />
        </div>
        <div>
          <h2 className="text-brand-navy mb-2 text-sm font-semibold">
            Recent subscriptions
          </h2>
          <DataTable
            columns={subscriptionColumns}
            data={data.recentSubscriptions}
            emptyTitle="No subscriptions"
            total={data.recentSubscriptions.length}
            page={1}
            pageSize={5}
          />
        </div>
      </div>
    </div>
  );
}
