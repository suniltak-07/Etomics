"use client";

import Link from "next/link";
import { PlanCreateForm, PlanForm } from "@/portals/admin/forms/PlanForm";
import { usePlan } from "@/features/plans/queries/usePlans";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { PageHeader, StatusBadge } from "@/portals/admin/components/AdminUi";
import { DeletePlanButton } from "@/portals/admin/components/DeletePlanButton";
import { EditPlanControl } from "@/portals/admin/components/EditPlanControl";
import { SetPlanInactiveButton } from "@/portals/admin/components/SetPlanInactiveButton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { isActivePlan } from "@/features/plans/plan-lock";

export function PlanCreatePage() {
  return (
    <div>
      <PageHeader
        title="Add plan"
        description="Start with a name and descriptions. You can add pricing, meals, and the rest after the plan is created."
      />
      <div className="border-brand-border bg-brand-surface rounded-lg border p-4">
        <PlanCreateForm />
      </div>
    </div>
  );
}

export function PlanEditPage({
  id,
  created = false,
}: {
  id: string;
  created?: boolean;
}) {
  const query = usePlan(id);

  if (query.isLoading) return <LoadingState title="Loading plan" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Plan not found"
        description={
          query.error instanceof Error ? query.error.message : undefined
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit · ${query.data.name}`}
        description={
          created
            ? "Plan created. Complete the remaining catalog fields."
            : "Update catalog fields. Changes apply immediately."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/plans/${id}`}>
              <Button size="sm" variant="outline">
                View
              </Button>
            </Link>
            <DeletePlanButton
              planId={id}
              planName={query.data.name}
              redirectTo="/admin/plans"
            />
          </div>
        }
      />
      <div className="border-brand-border bg-brand-surface rounded-lg border p-4">
        <PlanForm planId={id} initialPlan={query.data} created={created} />
      </div>
    </div>
  );
}

export function PlanDetailPage({ id }: { id: string }) {
  const query = usePlan(id);

  if (query.isLoading) return <LoadingState title="Loading plan" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Plan not found"
        description={
          query.error instanceof Error ? query.error.message : undefined
        }
      />
    );
  }

  const plan = query.data;
  const features = plan.features ?? [];
  const meals = plan.meals ?? [];
  const mealTypes = plan.mealTypes ?? [];

  return (
    <div>
      <PageHeader
        title={plan.name}
        description={plan.shortDescription}
        actions={
          <>
            {isActivePlan(plan.status) ? (
              <SetPlanInactiveButton planId={id} planName={plan.name} />
            ) : null}
            <EditPlanControl planId={id} status={plan.status} />
            <DeletePlanButton
              planId={id}
              planName={plan.name}
              redirectTo="/admin/plans"
            />
            <Link href="/admin/plans">
              <Button size="sm" variant="outline">
                Back
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={plan.status} />
        {plan.isFeatured ? <StatusBadge status="FEATURED" /> : null}
        <span className="text-brand-muted text-sm">
          Updated {plan.updatedAt ? formatDate(plan.updatedAt) : "—"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="border-brand-border bg-brand-surface rounded-lg border p-4">
            <h2 className="text-brand-navy mb-2 text-sm font-semibold">
              Overview
            </h2>
            <p className="text-brand-ink text-sm whitespace-pre-wrap">
              {plan.description || "No description yet."}
            </p>
          </section>
          <section className="border-brand-border bg-brand-surface rounded-lg border p-4">
            <h2 className="text-brand-navy mb-2 text-sm font-semibold">
              Features
            </h2>
            {features.length === 0 ? (
              <p className="text-brand-muted text-sm">No features yet.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="border-brand-border bg-brand-surface rounded-lg border p-4">
            <h2 className="text-brand-navy mb-2 text-sm font-semibold">
              Meals
            </h2>
            {meals.length === 0 ? (
              <p className="text-brand-muted text-sm">
                No meal rows configured.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {meals.map((meal) => (
                  <li
                    key={meal.id}
                    className="border-brand-border flex items-start justify-between gap-3 border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-brand-muted text-xs">
                        {meal.mealType}
                      </p>
                    </div>
                    {meal.calories ? (
                      <span className="text-brand-muted text-xs">
                        {meal.calories} kcal
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="space-y-4">
          <section className="border-brand-border bg-brand-surface rounded-lg border p-4 text-sm">
            <h2 className="text-brand-navy mb-2 text-sm font-semibold">
              Pricing
            </h2>
            <dl className="space-y-2">
              <div className="flex justify-between gap-2">
                <dt className="text-brand-muted">Price</dt>
                <dd className="font-medium">
                  {formatCurrency(plan.price || 0, plan.currency || "INR")}
                </dd>
              </div>
              {plan.compareAtPrice ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-brand-muted">Compare at</dt>
                  <dd>
                    {formatCurrency(
                      plan.compareAtPrice,
                      plan.currency || "INR",
                    )}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-brand-muted">Duration</dt>
                <dd>
                  {plan.duration} {plan.durationUnit?.toLowerCase() || "days"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-brand-muted">Meals / day</dt>
                <dd>{plan.mealsPerDay || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-brand-muted">Meal types</dt>
                <dd className="text-right">
                  {mealTypes.length ? mealTypes.join(", ") : "—"}
                </dd>
              </div>
            </dl>
          </section>
          {plan.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plan.image}
              alt={plan.name}
              className="border-brand-border aspect-video w-full rounded-lg border object-cover"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
