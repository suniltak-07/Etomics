"use client";

import { PlanStatus } from "@/types/enums";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/features/plans/components/PlanCard";
import { usePlans } from "@/features/plans/hooks/usePlans";
import { PageHeader } from "@/portals/customer/components/PageHeader";

export default function CustomerPlansPage() {
  const plansQuery = usePlans({
    status: PlanStatus.ACTIVE,
    pageSize: 50,
    sortBy: "displayOrder",
    sortOrder: "asc",
  });

  if (plansQuery.isLoading) {
    return <LoadingState title="Loading plans" />;
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        action={
          <Button variant="outline" onClick={() => plansQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const plans = plansQuery.data?.data ?? [];

  return (
    <div className="animate-[fade-up_0.5s_ease-out]">
      <PageHeader
        title="Meal plans"
        description="Choose a subscription crafted for your rhythm — breakfast, dinner, full-day care, or family."
      />

      {plans.length === 0 ? (
        <EmptyState title="No plans available" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
