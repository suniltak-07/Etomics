"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useNotifications } from "@/features/dashboard/hooks/useCustomerDashboard";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { formatDate } from "@/lib/utils/format";

export default function CustomerNotificationsPage() {
  const notificationsQuery = useNotifications({ pageSize: 50 });

  if (notificationsQuery.isLoading) {
    return <LoadingState title="Loading notifications" />;
  }

  if (notificationsQuery.isError) {
    return (
      <ErrorState
        action={
          <Button
            variant="outline"
            onClick={() => notificationsQuery.refetch()}
          >
            Try again
          </Button>
        }
      />
    );
  }

  const notifications = notificationsQuery.data?.data ?? [];

  return (
    <div className="animate-[fade-up_0.5s_ease-out]">
      <PageHeader
        title="Notifications"
        description="Delivery updates, subscription changes, and account notices."
      />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <ul className="divide-brand-border border-brand-border bg-brand-surface divide-y overflow-hidden rounded-xl border">
          {notifications.map((item) => {
            const content = (
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-brand-ink font-medium">{item.title}</p>
                    <Badge variant="muted">{item.type}</Badge>
                    {!item.isRead ? <Badge variant="success">New</Badge> : null}
                  </div>
                  <p className="text-brand-muted mt-1 text-sm">
                    {item.message}
                  </p>
                  <p className="text-brand-muted mt-2 text-xs">
                    {formatDate(item.createdAt, "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
            );

            return (
              <li key={item.id}>
                {item.link ? (
                  <Link
                    href={item.link}
                    className="hover:bg-brand-sand/70 block transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
