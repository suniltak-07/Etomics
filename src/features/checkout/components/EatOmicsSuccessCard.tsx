"use client";

import { SITE } from "@/lib/site";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Address, Subscription } from "@/types/entities";
import { DurationKind } from "@/types/enums";
import { Button } from "@/components/ui/button";

export function EatOmicsSuccessCard({
  customerName,
  planName,
  subscription,
  address,
  amount,
  currency = "INR",
}: {
  customerName: string;
  planName: string;
  subscription: Subscription;
  address?: Address | null;
  amount: number;
  currency?: string;
}) {
  const isTrial = subscription.durationKind === DurationKind.TRIAL;

  function printCard() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <article
        id="eatomics-card"
        className="border-brand-green/30 from-brand-navy via-brand-navy to-brand-navy-soft overflow-hidden rounded-3xl border bg-gradient-to-br text-white shadow-[0_28px_70px_-34px_rgba(11,31,58,0.75)] print:shadow-none"
      >
        <div className="border-b border-white/10 px-6 py-5">
          <p className="font-display text-2xl font-semibold tracking-tight">
            Eat<span className="text-brand-green-muted">Omics</span>
          </p>
          <p className="mt-1 text-sm text-white/70">{SITE.tagline}</p>
        </div>
        <div className="space-y-4 px-6 py-6">
          <p className="text-brand-green-muted text-xs tracking-[0.2em] uppercase">
            {isTrial ? "7-day trial" : "26-day subscription"}
          </p>
          <h2 className="font-display text-3xl font-semibold">
            {customerName}
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-white/55">Plan</dt>
              <dd className="font-medium">{planName}</dd>
            </div>
            <div>
              <dt className="text-white/55">Paid</dt>
              <dd className="font-medium">
                {formatCurrency(amount, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-white/55">Starts</dt>
              <dd className="font-medium">
                {formatDate(subscription.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-white/55">Through</dt>
              <dd className="font-medium">
                {formatDate(subscription.endDate)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-white/55">Meals</dt>
              <dd className="font-medium">
                {subscription.mealTypes.join(" · ")}
              </dd>
            </div>
            {address ? (
              <div className="sm:col-span-2">
                <dt className="text-white/55">Deliver to</dt>
                <dd className="font-medium">
                  {address.addressLine1}, {address.city} {address.pincode}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-sm text-white/75">
          <span>{SITE.phoneDisplay}</span>
          <span>Sundays off</span>
        </div>
      </article>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" variant="outline" onClick={printCard}>
          Print EatOmics card
        </Button>
      </div>
    </div>
  );
}
