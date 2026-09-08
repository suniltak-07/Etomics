"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Plan } from "@/types/entities";
import { calculateTrialPrice } from "@/lib/pricing/pricingEngine";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export interface PlanCardProps {
  plan: Plan;
  className?: string;
  subscribeHref?: string;
  detailHref?: string;
}

export function PlanCard({
  plan,
  className,
  subscribeHref,
  detailHref,
}: PlanCardProps) {
  const checkoutHref =
    subscribeHref ?? `/customer/checkout?planId=${encodeURIComponent(plan.id)}`;
  const viewHref = detailHref ?? `/plans/${plan.slug}`;

  return (
    <article
      className={cn(
        "group border-brand-border bg-brand-surface flex h-full flex-col overflow-hidden rounded-2xl border shadow-[0_12px_40px_-28px_rgba(11,31,58,0.45)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-28px_rgba(45,106,79,0.35)]",
        className,
      )}
    >
      <div className="bg-brand-sand relative aspect-[4/3] overflow-hidden">
        {plan.image ? (
          <Image
            src={plan.image}
            alt={plan.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        {plan.isFeatured ? (
          <Badge className="absolute top-3 left-3" variant="default">
            Featured
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-display text-brand-navy text-xl font-semibold">
            {plan.name}
          </h3>
          <p className="text-brand-muted mt-1 text-sm leading-relaxed">
            {plan.shortDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-display text-brand-ink text-2xl font-semibold">
            {formatCurrency(plan.price, plan.currency)}
          </span>
          {plan.compareAtPrice && plan.compareAtPrice > plan.price ? (
            <span className="text-brand-muted text-sm line-through">
              {formatCurrency(plan.compareAtPrice, plan.currency)}
            </span>
          ) : null}
          <span className="text-brand-muted text-xs">
            / {plan.duration} delivery days
          </span>
        </div>
        <p className="text-brand-green text-sm">
          7-day trial{" "}
          {formatCurrency(calculateTrialPrice(plan.price), plan.currency)}
        </p>

        <ul className="space-y-1.5">
          {plan.features.slice(0, 3).map((feature) => (
            <li
              key={feature}
              className="text-brand-ink flex items-start gap-2 text-sm"
            >
              <Check
                className="text-brand-green mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Link
            href={checkoutHref}
            className="bg-brand-green hover:bg-brand-green-light inline-flex h-10 flex-1 items-center justify-center rounded-md px-4 text-sm font-medium text-white transition-colors"
          >
            Subscribe
          </Link>
          <Link
            href={viewHref}
            className="border-brand-border bg-brand-surface text-brand-ink hover:bg-brand-sand inline-flex h-10 flex-1 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
