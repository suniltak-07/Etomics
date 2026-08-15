"use client";

import { useAdminDashboard } from "@/features/dashboard/queries/useAdminDashboard";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { MetricCard, PageHeader } from "@/portals/admin/components/AdminUi";
import { formatCurrency } from "@/lib/utils/format";

export function ReportsPage() {
  const dashboard = useAdminDashboard();

  if (dashboard.isLoading) return <LoadingState title="Loading reports" />;
  if (dashboard.isError || !dashboard.data) {
    return (
      <ErrorState
        title="Reports unavailable"
        description={
          dashboard.error instanceof Error ? dashboard.error.message : undefined
        }
      />
    );
  }

  const data = dashboard.data;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="High-level metrics. Detailed exports can be added later."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gross revenue"
          value={formatCurrency(data.payments.revenue, data.payments.currency)}
        />
        <MetricCard
          label="Successful payments"
          value={data.payments.successful}
          hint={`${data.payments.failed} failed`}
        />
        <MetricCard
          label="Active subscriptions"
          value={data.subscriptions.active}
          hint={`${data.subscriptions.paused} paused`}
        />
        <MetricCard
          label="Active customers"
          value={data.customers.active}
          hint={`${data.customers.total} total`}
        />
      </div>

      <section className="border-brand-border bg-brand-surface rounded-lg border p-4">
        <h2 className="text-brand-navy mb-3 text-sm font-semibold">
          Plan popularity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="text-brand-muted text-xs tracking-wide uppercase">
              <tr>
                <th className="px-2 py-2">Plan</th>
                <th className="px-2 py-2">Subscribers</th>
                <th className="px-2 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.planPopularity.map((row) => (
                <tr key={row.planId} className="border-brand-border border-t">
                  <td className="px-2 py-2 font-medium">{row.name}</td>
                  <td className="px-2 py-2 tabular-nums">{row.subscribers}</td>
                  <td className="px-2 py-2 tabular-nums">
                    {row.activeSubscribers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
