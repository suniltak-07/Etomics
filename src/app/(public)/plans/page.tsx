import type { Metadata } from "next";
import { PlanCard } from "@/features/plans/components/PlanCard";
import { EmptyState } from "@/components/states/EmptyState";
import { getActivePlans } from "@/features/plans/services/planServer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meal Plans",
  description:
    "Browse EatOmics meal subscriptions — breakfast, dinner, diabetic care, and family plans engineered for daily wellness.",
};

export default async function PlansPage() {
  const plans = await getActivePlans();

  return (
    <div className="bg-brand-sand">
      <section className="border-brand-border/60 bg-brand-navy border-b px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="animate-fade-up mx-auto max-w-6xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Meal plans
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Choose the rhythm that fits your life — one meal a day or a full
            nutrition system. Every plan is portion-controlled and delivered
            fresh.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        {plans.length === 0 ? (
          <EmptyState
            title="No plans available"
            description="Active meal plans will appear here as soon as they are published."
          />
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
