import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getActivePlans,
  getPlanBySlug,
} from "@/features/plans/services/planServer";
import { WellnessNotice } from "@/components/brand/WellnessNotice";
import { calculateTrialPrice } from "@/lib/pricing/pricingEngine";
import { formatCurrency } from "@/lib/utils/format";

export async function generateStaticParams() {
  return getActivePlans().map((plan) => ({ slug: plan.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/plans/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const plan = getPlanBySlug(slug);
  if (!plan) {
    return { title: "Plan not found" };
  }
  return {
    title: plan.seoTitle ?? plan.name,
    description: plan.seoDescription ?? plan.shortDescription,
  };
}

export default async function PlanDetailPage({
  params,
}: PageProps<"/plans/[slug]">) {
  const { slug } = await params;
  const plan = getPlanBySlug(slug);
  if (!plan) notFound();

  const subscribeHref = `/customer/checkout?planId=${encodeURIComponent(plan.id)}`;
  const loginHref = `/login?redirect=${encodeURIComponent(subscribeHref)}`;

  return (
    <div className="bg-brand-sand">
      <section className="bg-brand-navy relative isolate min-h-[55vh] overflow-hidden text-white">
        <Image
          src={plan.image}
          alt={plan.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="from-brand-navy/90 via-brand-navy/70 to-brand-navy/40 absolute inset-0 bg-gradient-to-r" />
        <div className="relative mx-auto flex min-h-[55vh] max-w-6xl flex-col justify-end px-4 py-16 sm:px-6 lg:px-8">
          <div className="animate-fade-up max-w-2xl space-y-4">
            {plan.isFeatured ? (
              <Badge className="bg-brand-green text-white">Featured</Badge>
            ) : null}
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {plan.name}
            </h1>
            <p className="text-base leading-relaxed text-white/80 sm:text-lg">
              {plan.shortDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-brand-navy text-2xl font-semibold">
                About this plan
              </h2>
              <p className="text-brand-muted mt-3 text-base leading-relaxed">
                {plan.description}
              </p>
              <WellnessNotice className="mt-5" />
            </div>

            <div>
              <h2 className="font-display text-brand-navy text-2xl font-semibold">
                What&apos;s included
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="text-brand-navy/90 flex items-start gap-2 text-sm"
                  >
                    <Check
                      className="text-brand-green mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {plan.meals.length > 0 ? (
              <div>
                <h2 className="font-display text-brand-navy text-2xl font-semibold">
                  Sample meals
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {plan.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="border-brand-border/80 bg-brand-surface hover:border-brand-green/40 rounded-xl border p-4 transition"
                    >
                      <p className="text-brand-green text-xs font-medium tracking-wide uppercase">
                        {meal.mealType.toLowerCase()}
                      </p>
                      <p className="text-brand-navy mt-1 font-medium">
                        {meal.name}
                      </p>
                      {meal.description ? (
                        <p className="text-brand-muted mt-1 text-sm">
                          {meal.description}
                        </p>
                      ) : null}
                      {meal.calories ? (
                        <p className="text-brand-muted mt-2 text-xs">
                          {meal.calories} kcal
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {plan.deliveryInformation ? (
              <div>
                <h2 className="font-display text-brand-navy text-2xl font-semibold">
                  Delivery
                </h2>
                <p className="text-brand-muted mt-3 text-base leading-relaxed">
                  {plan.deliveryInformation}
                </p>
              </div>
            ) : null}

            {plan.terms ? (
              <p className="text-brand-muted text-xs leading-relaxed">
                {plan.terms}
              </p>
            ) : null}
          </div>

          <aside className="border-brand-border bg-brand-surface h-fit rounded-2xl border p-6 shadow-sm lg:sticky lg:top-24">
            <div className="space-y-1">
              <p className="font-display text-brand-navy text-3xl font-semibold">
                {formatCurrency(plan.price, plan.currency)}
              </p>
              {plan.compareAtPrice ? (
                <p className="text-brand-muted text-sm line-through">
                  {formatCurrency(plan.compareAtPrice, plan.currency)}
                </p>
              ) : null}
              <p className="text-brand-muted text-sm">
                {plan.duration} delivery days · {plan.mealCount} meals
              </p>
              <p className="text-brand-green text-sm font-medium">
                7-day trial{" "}
                {formatCurrency(calculateTrialPrice(plan.price), plan.currency)}
              </p>
            </div>

            <dl className="border-brand-border/70 mt-6 space-y-3 border-t pt-6 text-sm">
              {plan.calories ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-brand-muted">Calories</dt>
                  <dd className="text-brand-navy font-medium">
                    {plan.calories}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">Meals / day</dt>
                <dd className="text-brand-navy font-medium">
                  {plan.mealsPerDay}
                </dd>
              </div>
              {plan.servingSize ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-brand-muted">Serving</dt>
                  <dd className="text-brand-navy text-right font-medium">
                    {plan.servingSize}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={subscribeHref}
                className="bg-brand-green hover:bg-brand-green-light inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-white transition"
              >
                Subscribe now
              </Link>
              <Link
                href={loginHref}
                className="border-brand-border bg-brand-surface text-brand-navy hover:bg-brand-sand inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium transition"
              >
                Log in to subscribe
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
