import Link from "next/link";
import { PlanCard } from "@/features/plans/components/PlanCard";
import type { Plan } from "@/types/entities";

export interface FeaturedPlansProps {
  plans: Plan[];
}

export function FeaturedPlans({ plans }: FeaturedPlansProps) {
  return (
    <section className="bg-brand-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-brand-navy text-3xl font-semibold tracking-tight sm:text-4xl">
              Meal plans
            </h2>
            <p className="text-brand-muted mt-3 text-base leading-relaxed sm:text-lg">
              Featured subscriptions engineered for mornings, evenings, or
              full-day metabolic care.
            </p>
          </div>
          <Link
            href="/plans"
            className="text-brand-green hover:text-brand-green-light text-sm font-medium transition-colors"
          >
            View all plans →
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
