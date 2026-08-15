"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { EatOmicsSuccessCard } from "@/features/checkout/components/EatOmicsSuccessCard";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { useSubscriptions } from "@/features/subscriptions/hooks/useSubscriptions";
import { usePlans } from "@/features/plans/hooks/usePlans";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { paymentBadgeVariant } from "@/lib/utils/statusBadges";
import { PaymentStatus } from "@/types/enums";
import { useAppSelector } from "@/store/hooks";

export default function CustomerPaymentsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const paymentsQuery = usePayments({ pageSize: 50 });
  const subscriptionsQuery = useSubscriptions({ pageSize: 50 });
  const plansQuery = usePlans({ pageSize: 50 });

  if (paymentsQuery.isLoading) {
    return <LoadingState title="Loading payments" />;
  }

  if (paymentsQuery.isError) {
    return (
      <ErrorState
        action={
          <Button variant="outline" onClick={() => paymentsQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const payments = paymentsQuery.data?.data ?? [];
  const subscriptions = subscriptionsQuery.data?.data ?? [];
  const plans = plansQuery.data?.data ?? [];
  const latestSuccess = payments.find(
    (item) => item.status === PaymentStatus.SUCCESS && item.subscriptionId,
  );
  const latestSub = subscriptions.find(
    (item) => item.id === latestSuccess?.subscriptionId,
  );
  const latestPlan = plans.find((item) => item.id === latestSub?.planId);

  return (
    <div className="animate-[fade-up_0.5s_ease-out]">
      <PageHeader
        title="Payments"
        description="Charges and your EatOmics membership card."
      />

      {latestSuccess && latestSub && latestPlan ? (
        <div className="mb-8">
          <EatOmicsSuccessCard
            customerName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
            planName={latestPlan.name}
            subscription={latestSub}
            amount={latestSuccess.amount}
            currency={latestSuccess.currency}
          />
        </div>
      ) : null}

      {payments.length === 0 ? (
        <EmptyState title="No payments yet" />
      ) : (
        <div className="border-brand-border bg-brand-surface overflow-hidden rounded-xl border">
          <ul className="divide-brand-border divide-y">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-brand-ink font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-brand-muted text-sm">
                    {formatDate(payment.createdAt, "dd MMM yyyy, HH:mm")}
                    {payment.method ? ` · ${payment.method.toUpperCase()}` : ""}
                  </p>
                  {payment.failureReason ? (
                    <p className="text-brand-danger mt-1 text-sm">
                      {payment.failureReason}
                    </p>
                  ) : null}
                </div>
                <Badge variant={paymentBadgeVariant(payment.status)}>
                  {payment.status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
